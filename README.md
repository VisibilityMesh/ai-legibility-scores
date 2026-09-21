# AI Legibility Scores: 596 websites scored on what AI can read

A public dataset from the Visibility Mesh live benchmark. Each row is 1 public website, its AI legibility score (0 to 100), its maturity band, the platform detected on the scan, whether the site is an online store, and the date of the scan that produced the score. No findings, no page data, no personal data.

Canonical home: https://visibilitymesh.com/pages/ai-legibility-dataset
Study the scores come from: https://visibilitymesh.com/pages/ai-visibility-study-2026
Method: https://visibilitymesh.com/pages/about (the 5 categories) and https://visibilitymesh.com/pages/our-score (the bands, and our own score, published monthly)

## What is in the file

`ai_legibility_scores.csv`, 596 rows, generated 2026-09-21 from the benchmark as it stood that day.

| Column | Meaning |
|---|---|
| rank | 1 = highest score |
| domain | the website, without www |
| ai_legibility_score | 0 to 100, 1 decimal. Share of the available points the site earned across 5 categories: can AI find you, read you, follow you, quote you, trust you |
| band | Starting Point (0 to 39), Developing (40 to 59), Established (60 to 79), Leading (80 to 100) |
| platform | what the crawl detected: shopify, wordpress, custom, react-spa, webflow, bigcommerce, woocommerce, squarespace, wix, unknown |
| is_ecommerce | true, false or unknown, as detected on the scan |
| scanned_on | date of the scan that produced the counted score (the latest scan of that domain at this methodology version) |
| methodology_version | aivs-1.0-aeo20260620-full-evid20260621 for every row; scores are comparable within 1 version only |

## Headline figures (2026-09-21)

- 596 websites published: median 47.4, 59.9% below 50, 0 in the Leading band. Bands: Starting Point 156, Developing 388, Established 52.
- The full live benchmark the same day: 747 websites, median 43.8, 67% below 50, 0 Leading. The 151 websites not in this file were scanned at the request of a merchant, an app user, an agency or a customer, and are counted in the benchmark but never named here. The published subset scores higher because the withheld 151 are almost all online stores (145 of 151, 134 on Shopify, 128 of them merchants who scanned through the Shopify app) with a median of 20.4.
- Platforms in the file: shopify 241, custom 197, wordpress 75, react-spa 54, webflow 12, bigcommerce 4, woocommerce 4, unknown 4, squarespace 3, wix 2.

## How a score is produced

The scanner fetches a site's pages the way AI crawlers (GPTBot, PerplexityBot, Googlebot and others) fetch them, reads what those crawlers can use, and scores 5 categories: crawler access and rendering (find), structured data accuracy (read), site architecture and internal links (follow), answer ready copy (quote), and entity consistency (trust). The total is the share of available points, expressed 0 to 100. Every score in this file was produced by the same engine at the same methodology version. The engine does not use rankings, traffic or mention data; it measures legibility only, which is why a well known site can score low and a small one can score high.

## What this dataset is not

- Not a ranking of quality, traffic or revenue. A score says how much of a site a machine can read, trust and quote, nothing else.
- Not a claim about citations. Nobody controls what an AI assistant says.
- Not a sample of the web. The sites were chosen for 2 studies (216 Shopify storefronts in July 2026 and 303 non ecommerce websites across 25 verticals, July 2026) plus later additions to the same cohort, all scanned by Visibility Mesh at its own initiative.

## Reproducing the numbers

`build_dataset.mjs` rebuilds the file from the live database (needs internal credentials). `stats.json` carries the counts above. Sites are re scanned over time; a newer release replaces this file and the canonical page states the date.

## License and citation

CC BY 4.0. Cite as: Visibility Mesh (2026). AI Legibility Scores, 596 websites, methodology aivs-1.0. https://visibilitymesh.com/pages/ai-legibility-dataset

Questions and corrections: press@visibilitymesh.com. A site owner who wants their row removed or re scanned can write to the same address; removals are honored within 5 working days.

Visibility Mesh measures what AI can read on a website and fixes it. https://visibilitymesh.com
