#!/usr/bin/env python3
"""
Recipe scraper service using recipe-scrapers library.
This script scrapes recipe data from URLs and returns JSON data.
"""

import sys
import json
from recipe_scrapers import scrape_me

def scrape_recipe(url):
    """
    Scrape a recipe from the given URL using recipe-scrapers.

    Args:
        url (str): The URL of the recipe to scrape

    Returns:
        dict: Recipe data in a standardized format
    """
    try:
        # Scrape the recipe using scrape_me
        scraper = scrape_me(url)

        # Extract basic data
        data = {
            'name': scraper.title(),
            'description': scraper.description(),
            'ingredients': scraper.ingredients(),
            'instructions': scraper.instructions(),
            'image': scraper.image(),
            'sourceUrl': url,
            'author': scraper.author(),
            'host': scraper.host(),
            'canonical_url': scraper.canonical_url(),
            'language': scraper.language(),
            'site_name': scraper.site_name(),
            'yields': scraper.yields(),
        }

        # Add optional time data if available
        try:
            data['totalTimeMinutes'] = scraper.total_time()
        except:
            data['totalTimeMinutes'] = None

        try:
            data['prepTimeMinutes'] = scraper.prep_time()
        except:
            data['prepTimeMinutes'] = None

        try:
            data['cookTimeMinutes'] = scraper.cook_time()
        except:
            data['cookTimeMinutes'] = None

        # Add optional category data
        try:
            data['category'] = scraper.category()
        except:
            data['category'] = None

        try:
            data['cuisine'] = scraper.cuisine()
        except:
            data['cuisine'] = None

        # Add ratings if available
        try:
            data['ratings'] = scraper.ratings()
        except:
            data['ratings'] = None

        try:
            data['ratings_count'] = scraper.ratings_count()
        except:
            data['ratings_count'] = None

        # Add nutrients if available
        try:
            data['nutrients'] = scraper.nutrients()
        except:
            data['nutrients'] = None

        return data

    except Exception as e:
        return {
            'error': str(e),
            'url': url
        }

def main():
    """Main function to handle command line arguments."""
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Usage: python scraper.py <url>'}))
        sys.exit(1)

    url = sys.argv[1]
    result = scrape_recipe(url)
    print(json.dumps(result, ensure_ascii=False))

if __name__ == '__main__':
    main()