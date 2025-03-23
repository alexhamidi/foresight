from bs4 import BeautifulSoup
from typing import List, Dict
import logging
from playwright.async_api import async_playwright
import asyncio
from asyncio import Semaphore
from datetime import datetime


async def fetch_additional_details(page, product_url: str) -> Dict:
    """Fetch additional details (author and categories) from a product's page"""
    try:
        await page.goto(product_url)
        await page.wait_for_selector('section[data-sentry-component="Team"]', timeout=5000)
        html = await page.content()

        soup = BeautifulSoup(html, 'html.parser')
        result = {'author_name': None, 'author_profile_url': None, 'categories': []}

        # Get author details
        team_section = soup.find('section', attrs={'data-sentry-component': 'Team'})
        if team_section:
            member = team_section.find('a', attrs={
                'data-sentry-component': lambda x: x in ['TeamUser', 'TeamUserFull']
            })

            if member:
                if member.get('data-sentry-component') == 'TeamUserFull':
                    name_div = member.find('div', {'class': 'text-16'})
                    name = name_div.get_text(strip=True).split('\n')[0] if name_div else None
                else:
                    img_tag = member.find('img')
                    name = img_tag.get('alt', '') if img_tag else None

                if name:
                    result['author_name'] = name
                    result['author_profile_url'] = 'https://www.producthunt.com' + member['href']

        # Get categories
        extra_info_section = soup.find('section', attrs={'data-sentry-component': 'ExtraInfo'})
        if extra_info_section:
            tag_list = extra_info_section.find('div', attrs={'data-sentry-component': 'TagList'})
            if tag_list:
                category_links = tag_list.find_all('a', {'class': lambda x: x and 'text-16' in x})
                result['categories'] = [link.get_text(strip=True) for link in category_links]

        return result
    except Exception as e:
        logging.error(f"Error fetching additional details for {product_url}: {e}")
        return {'author_name': None, 'author_profile_url': None, 'categories': []}

async def scrape_product_hunt_monthly(year: int, month: int, num_scrolls: int = 5) -> List[Dict]:
    try:
        url = f"https://www.producthunt.com/leaderboard/monthly/{year}/{month}"

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)

            # Create a semaphore to limit concurrent page operations
            semaphore = Semaphore(5)  # Limit to 5 concurrent requests

            # Create a context that will be shared among pages
            context = await browser.new_context()
            main_page = await context.new_page()

            # Fetch main page content
            await main_page.goto(url)
            for _ in range(num_scrolls):
                await main_page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await main_page.wait_for_timeout(2000)

            html = await main_page.content()
            soup = BeautifulSoup(html, 'html.parser')
            products = []

            product_sections = soup.find_all('section', attrs={'data-test': lambda x: x and x.startswith('post-item-')})

            async def process_product(section):
                try:
                    title_link = section.find('a', attrs={'data-test': lambda x: x and x.startswith('post-name-')})
                    title = title_link.get_text(strip=True).rstrip()
                    link = 'https://www.producthunt.com' + title_link['href']

                    description = section.find('a', {'class': 'text-secondary'}).get_text(strip=True)
                    img_tag = section.find('img')
                    image_url = img_tag['src'] if img_tag else None

                    # Fetch additional details with semaphore
                    async with semaphore:
                        product_page = await context.new_page()
                        additional_details = await fetch_additional_details(product_page, link)
                        await product_page.close()

                    # Find the post date
                    date_element = section.find('span', attrs={'data-test': lambda x: x and x.startswith('post-date-')})
                    created_at = date_element.get('datetime') if date_element else datetime.now().isoformat()

                    product = {
                        "title": title,
                        "description": description,
                        "link": link,
                        "source": "product_hunt",
                        "source_link": url,
                        "image_url": image_url,
                        "author_name": additional_details['author_name'],
                        "author_profile_url": additional_details['author_profile_url'],
                        "categories": additional_details['categories'],
                        "created_at": created_at,
                    }
                    return product
                except Exception as e:
                    logging.error(f"Error processing product section: {e}")
                    return None

            # Process all products in parallel
            tasks = [process_product(section) for section in product_sections]
            results = await asyncio.gather(*tasks)

            # Filter out None results from errors
            products = [p for p in results if p is not None]

            await browser.close()
            return products

    except Exception as e:
        logging.error(f"Error scraping Product Hunt monthly page: {e}")
        return []


"""
<section class="flex flex-col" data-sentry-component="ExtraInfo" data-sentry-source-file="index.tsx"><div class="flex flex-row justify-between gap-2"><div class="flex flex-row flex-wrap items-center gap-2" data-sentry-component="TagList" data-sentry-source-file="index.tsx"><div class="text-16 font-normal text-dark-gray text-gray-700" data-sentry-element="Component" data-sentry-component="LegacyText" data-sentry-source-file="index.tsx">Launch tags:</div><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 14 14" data-sentry-element="TagIcon" data-sentry-source-file="index.tsx"><path stroke="#667085" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m12.25 6.417-4.43-4.43c-.303-.303-.454-.454-.63-.562a1.8 1.8 0 0 0-.506-.21c-.202-.048-.416-.048-.844-.048H3.5M1.75 5.075v1.152c0 .285 0 .428.032.562q.044.18.14.337c.072.118.173.219.375.42l4.55 4.55c.462.463.693.694.96.78.233.077.486.077.72 0 .267-.086.498-.317.96-.78l1.443-1.443c.462-.462.693-.693.78-.96a1.17 1.17 0 0 0 0-.72c-.087-.267-.318-.498-.78-.96L6.672 3.755c-.202-.202-.303-.303-.42-.375a1.2 1.2 0 0 0-.338-.14c-.134-.032-.277-.032-.562-.032H3.617c-.654 0-.98 0-1.23.128-.22.111-.398.29-.51.51-.127.249-.127.576-.127 1.229"></path></svg><a class="text-16 font-normal text-dark-gray text-primary hover:underline" target="_blank" href="/topics/software-engineering">Software Engineering</a><span class="relative -top-px text-12 text-light-gray opacity-45" data-sentry-component="DotSeparator" data-sentry-source-file="index.tsx">•</span><a class="text-16 font-normal text-dark-gray text-primary hover:underline" target="_blank" href="/topics/developer-tools">Developer Tools</a><span class="relative -top-px text-12 text-light-gray opacity-45" data-sentry-component="DotSeparator" data-sentry-source-file="index.tsx">•</span><a class="text-16 font-normal text-dark-gray text-primary hover:underline" target="_blank" href="/topics/artificial-intelligence">Artificial Intelligence</a></div><div class="flex flex-row gap-4"><button class="size-12 rounded-full border-2 border-gray-200 transition-all duration-300 hover:border-gray-300 hover:bg-gray-100" data-sentry-component="CommentsButton" data-sentry-source-file="index.tsx"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20" data-sentry-element="ChatIcon" data-sentry-source-file="index.tsx"><g clip-path="url(#ChatIcon_svg__a)"><path stroke="#344054" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.667" d="M5.078 9.357A7 7 0 0 1 5 8.333c0-3.681 3.004-6.666 6.71-6.666s6.71 2.985 6.71 6.666c0 .832-.153 1.628-.433 2.362-.058.153-.087.23-.1.289a1 1 0 0 0-.02.16c-.001.062.007.129.024.263l.335 2.725c.037.295.055.443.006.55a.42.42 0 0 1-.215.21c-.108.046-.255.024-.55-.019l-2.653-.389c-.139-.02-.208-.03-.271-.03a.7.7 0 0 0-.167.018c-.062.013-.14.042-.299.101a6.74 6.74 0 0 1-3.392.35m-4.326 3.41c2.471 0 4.474-2.052 4.474-4.583S8.83 9.167 6.36 9.167s-4.473 2.052-4.473 4.583c0 .509.08.998.23 1.456.063.193.095.29.105.356a.7.7 0 0 1 .009.177 2 2 0 0 1-.054.293l-.51 2.301 2.496-.34c.136-.019.205-.028.264-.028.063 0 .096.004.157.016.059.012.145.042.319.104a4.4 4.4 0 0 0 1.457.248"></path></g><defs><clipPath id="ChatIcon_svg__a"><path fill="#fff" d="M0 0h20v20H0z"></path></clipPath></defs></svg></button><button data-test="collection-product-525253-collect" class="size-12 rounded-full border-2 border-gray-200 transition-all duration-300 hover:border-gray-300 hover:bg-gray-100" data-sentry-component="BookmarkButton" data-sentry-source-file="index.tsx"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20" data-sentry-element="BookmarkIcon" data-sentry-source-file="index.tsx"><path stroke="#344054" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.667" d="M4.167 6.5c0-1.4 0-2.1.272-2.635a2.5 2.5 0 0 1 1.093-1.093C6.066 2.5 6.766 2.5 8.166 2.5h3.667c1.4 0 2.1 0 2.635.272a2.5 2.5 0 0 1 1.093 1.093c.272.535.272 1.235.272 2.635v11L10 14.167 4.167 17.5z"></path></svg></button><button data-test="share-button" class="size-12 rounded-full border-2 border-gray-200 transition-all duration-300 hover:border-gray-300 hover:bg-gray-100" data-sentry-component="ShareButton" data-sentry-source-file="index.tsx"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20" data-sentry-element="ShareIcon" data-sentry-source-file="index.tsx"><path stroke="#344054" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.667" d="M17.5 10v3.5c0 1.4 0 2.1-.273 2.635a2.5 2.5 0 0 1-1.092 1.092c-.535.273-1.235.273-2.635.273h-7c-1.4 0-2.1 0-2.635-.273a2.5 2.5 0 0 1-1.093-1.092C2.5 15.6 2.5 14.9 2.5 13.5V10m10.833-4.167L10 2.5m0 0L6.667 5.833M10 2.5v10"></path></svg></button><button class="size-12 rounded-full border-2 border-gray-200 transition-all duration-300 hover:border-gray-300 hover:bg-gray-100" data-sentry-component="ShareButton" data-sentry-source-file="index.tsx"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20" data-sentry-element="InsightsIcon" data-sentry-source-file="index.tsx"><path stroke="#344054" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.667" d="M7.5 5.833H3.833c-.466 0-.7 0-.878.091a.83.83 0 0 0-.364.364c-.091.179-.091.412-.091.879v9c0 .466 0 .7.09.878.08.157.208.284.365.364.178.091.412.091.878.091H7.5m0 0h5m-5 0V3.833c0-.466 0-.7.09-.878a.83.83 0 0 1 .365-.364c.178-.091.412-.091.878-.091h2.334c.466 0 .7 0 .878.09.157.08.284.208.364.365.091.178.091.412.091.878V17.5m0-8.333h3.667c.466 0 .7 0 .878.09.157.08.284.208.364.365.091.178.091.411.091.878v5.667c0 .466 0 .7-.09.878a.83.83 0 0 1-.365.364c-.178.091-.412.091-.878.091H12.5"></path></svg></button></div></div></section>
"""
