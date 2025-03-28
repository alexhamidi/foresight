from bs4 import BeautifulSoup
from typing import List, Dict, Any
import logging
from playwright.async_api import async_playwright
import asyncio
from asyncio import Semaphore
from datetime import datetime
import re

def get_batch_timestamp(batch_tag: str) -> str:
    """Convert YC batch code to ISO8601 timestamp
    Examples:
    - W24 -> 2024-01-01T00:00:00Z (Winter = January)
    - X24 -> 2024-04-01T00:00:00Z (Spring = April)
    - S24 -> 2024-06-01T00:00:00Z (Summer = June)
    - F24 -> 2024-09-01T00:00:00Z (Fall = September)
    """
    if not batch_tag:
        return datetime.now().isoformat() + "Z"

    try:
        # Extract year and season
        season = batch_tag[0].upper()
        year = int(batch_tag[1:])
        if year < 50:  # Assume years less than 50 are 2000s
            year = 2000 + year
        else:  # Assume years 50-99 are 1900s
            year = 1900 + year

        # Map seasons to months
        month = {
            'W': '01',  # Winter = January
            'X': '04',  # Spring = April
            'S': '06',  # Summer = June
            'F': '09',  # Fall = September
        }.get(season)

        if not month:
            return datetime.now().isoformat() + "Z"

        # Create ISO8601 timestamp
        return f"{year}-{month}-01T00:00:00Z"
    except Exception as e:
        logging.error(f"Error parsing batch tag {batch_tag}: {e}")
        return datetime.now().isoformat() + "Z"

async def fetch_company_details(page, company_url: str) -> Dict[str, Any]:
    """Fetch additional details from a company's page"""
    try:
        await page.goto(company_url)
        await page.wait_for_selector('.prose', timeout=5000)
        html = await page.content()

        soup = BeautifulSoup(html, 'html.parser')
        result = {
            'description': '',
            'categories': [],
            'image_url': '',
            'author_name': '',
            'author_profile_url': '',
            'batch': '',
            'website_url': ''
        }

        # Get website URL
        website_link = soup.find('a', {'target': '_blank', 'class': lambda x: x and 'whitespace-nowrap' in x})
        if website_link:
            result['website_url'] = website_link.get('href', '')

        # Get full description
        description_div = soup.find('div', {'class': 'prose', 'class': 'max-w-full', 'class': 'whitespace-pre-line'})
        if description_div:
            result['description'] = description_div.get_text(strip=True)

        # Get categories/tags and batch
        tags_div = soup.find_all('div', {'class': 'yc-tw-Pill'})
        if tags_div:
            categories = []
            for tag in tags_div:
                tag_text = tag.get_text(strip=True)
                # Extract batch tag using regex
                batch_match = re.search(r'[WSXF]\d{2}', tag_text)
                if batch_match:
                    result['batch'] = batch_match.group(0)
                # If not a batch tag or status, it's a category
                elif not any(x in tag_text.lower() for x in ['public', 'y combinator', 'logo']):
                    categories.append(tag_text.lower())
            result['categories'] = categories

        # Get company logo/image
        logo_img = soup.find('img', {'class': 'rounded-xl'})
        if logo_img:
            result['image_url'] = logo_img.get('src', '')

        # Get founder info from Active Founders section
        founders_section = soup.find('div', string='Active Founders')
        if founders_section:
            # Find the first founder's info
            founder_div = soup.find('div', {'class': 'flex flex-row flex-col items-start gap-6 md:flex-row'})
            if founder_div:
                # Get founder name from the h3 tag
                founder_name_h3 = founder_div.find('h3', {'class': 'text-lg font-bold'})
                if founder_name_h3:
                    # Extract just the name part before the comma
                    founder_name = founder_name_h3.get_text(strip=True).split(',')[0]
                    result['author_name'] = founder_name

                    # Find the founder's card div that contains social links
                    founder_card = founder_div.find('div', {'class': 'ycdc-card-new'})
                    if founder_card:
                        # Try to get LinkedIn URL first
                        linkedin_link = founder_card.find('a', {'class': lambda x: x and 'bg-image-linkedin' in x})
                        if linkedin_link:
                            result['author_profile_url'] = linkedin_link.get('href', '')
                        else:
                            # Fallback to Twitter if no LinkedIn
                            twitter_link = founder_card.find('a', {'class': lambda x: x and 'bg-image-twitter' in x})
                            if twitter_link:
                                result['author_profile_url'] = twitter_link.get('href', '')

        return result
    except Exception as e:
        logging.error(f"Error fetching company details for {company_url}: {e}")
        return {
            'description': '',
            'categories': [],
            'image_url': '',
            'author_name': '',
            'author_profile_url': '',
            'batch': '',
            'website_url': ''
        }

async def scrape_yc_companies(num_companies: int = 100, num_scrolls: int = 5, url: str = "https://www.ycombinator.com/companies") -> List[Dict[str, Any]]:
    """Scrape YC companies and their details"""
    try:

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()

            # Create a semaphore to limit concurrent page operations
            semaphore = Semaphore(5)  # Limit to 5 concurrent requests

            # Fetch main companies page
            main_page = await context.new_page()
            await main_page.goto(url)

            # Scroll to load more companies
            for _ in range(num_scrolls):  # Adjust number of scrolls based on how many companies you want
                await main_page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await main_page.wait_for_timeout(2000)

            html = await main_page.content()
            soup = BeautifulSoup(html, 'html.parser')
            companies = []

            # Find all company sections
            company_links = soup.find_all('a', {'class': '_company_i9oky_355'})[:num_companies]

            async def process_company(company_link):
                try:
                    # Extract basic company info from the list
                    company_name = company_link.find('span', {'class': '_coName_i9oky_470'}).get_text(strip=True)
                    description = company_link.find('span', {'class': '_coDescription_i9oky_495'}).get_text(strip=True)
                    link = 'https://www.ycombinator.com' + company_link['href']

                    # Fetch additional details with semaphore
                    async with semaphore:
                        company_page = await context.new_page()
                        details = await fetch_company_details(company_page, link)
                        await company_page.close()

                    company = {
                        "title": company_name,
                        "description": details['description'] or description,  # Use full description if available
                        "link": details['website_url'] or link,  # Use the actual website URL if available
                        "source": "y_combinator",
                        "source_link": link,
                        "image_url": details['image_url'],
                        "author_name": details['author_name'],
                        "author_profile_url": details['author_profile_url'],
                        "categories": details['categories'],
                        "created_at": get_batch_timestamp(details['batch']),
                    }
                    return company
                except Exception as e:
                    logging.error(f"Error processing company: {e}")
                    return None

            # Process all companies in parallel
            tasks = [process_company(link) for link in company_links]
            results = await asyncio.gather(*tasks)

            # Filter out None results from errors
            companies = [c for c in results if c is not None]

            await browser.close()
            return companies

    except Exception as e:
        logging.error(f"Error scraping YC companies page: {e}")
        return []

# Helper function for non-async contexts
def get_yc_companies_sync(num_companies: int = 100) -> List[Dict[str, Any]]:
    """Synchronous wrapper for scrape_yc_companies"""
    return asyncio.run(scrape_yc_companies(num_companies))
