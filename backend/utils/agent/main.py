import asyncio

from app.agent.manus import Manus
from app.logger import logger
import uuid
import os


def get_file_content(run_id):
    file_path = f"workspace/report_{run_id}.md"
    if os.path.exists(file_path):
        with open(file_path, "r") as file:
            return file.read()
    return None

async def main():
    # Create and initialize Manus agent
    agent = await Manus.create(max_steps=20)

    run_id = uuid.uuid4()

    try:
        user_prompt = input("Enter your potential idea: ")

        system_prompt = f"""You are an AI Agent that will conduct an online search for projects related to the user's prompt. You should find 5 of the most relevant active/recent projects online, and once you have found them, you will create the file report_{run_id}.md with the results of your search."""

        prompt = f"""
        # SYSTEM PROMPT:
        {system_prompt}

        # USER PROMPT:
        {user_prompt}
        """

        logger.warning("Processing your request...")
        await agent.run(prompt)
        logger.info("Request processing completed.")

        file_content = get_file_content(run_id)
        print("--main--", file_content)
    except KeyboardInterrupt:
        logger.warning("Operation interrupted.")
    finally:
        # Ensure agent resources are cleaned up before exiting
        await agent.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
