import requests
from bs4 import BeautifulSoup
import json

base_url = "https://www.cheese.com"
alphabetical_url = base_url + "/alphabetical/"
results = []

page_number = 1

while True:
    print(f"Fetching page {page_number}...")
    url = alphabetical_url
    if page_number > 1:
        url += f"?page={page_number}"

    response = requests.get(url)
    if response.status_code != 200:
        # If we can't fetch the page, break out of the loop
        break

    soup = BeautifulSoup(response.text, "html.parser")
    product_items = soup.find_all("div", class_="product-item")
    if not product_items:
        # No product items found, probably no more pages
        break

    for item in product_items:
        # Extract the name
        name_tag = item.find("h3")
        cheese_name = name_tag.get_text(strip=True) if name_tag else None

        # Extract the image
        img_tag = item.find("div", class_="product-img").find("img")
        if img_tag:
            img_src = img_tag.get("src", "")
            # Check if image is default
            if "icon-cheese-default" not in img_src:
                # Construct full image URL if it's relative
                if img_src.startswith("/"):
                    img_src = base_url + img_src

                results.append({"name": cheese_name, "image": img_src})

    page_number += 1

# write the results to a json file
with open("cheeses.json", "w") as f:
    json.dump(results, f, indent=2)
