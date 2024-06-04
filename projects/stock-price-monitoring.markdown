---
layout: base
title: Projects
permalink: /projects/stock-price-monitoring
---

# Stock Price Monitoring on Desktop

Source Code: [![chaoyihu - stock-price-monitor](https://img.shields.io/static/v1?label=chaoyihu&message=stock-price-monitor&color=blue&logo=github)](https://github.com/chaoyihu/stock-price-monitor)

## What does it do

This is a JavaFX application only for one purpose: to monitor stock price fluctuations.

The app scrapes prices from Google Finance pages [like this one](https://www.google.com/finance/quote/AAPL:NASDAQ) and plots it for you on desktop.

## How to use it

Prerequisite: You need to have JDK and Gradle installed.

- Go to [https://github.com/chaoyihu/stock-price-monitor](https://github.com/chaoyihu/stock-price-monitor).
- Pull the code.
- Open your terminal and run `./gradlew run --args="Apple"`. Replace the arg with the name of any stock you like. It does not have to be a ticker because the app does an automatic query to find that out.
- A window will open up and refresh the price plot of the stock every 5 seconds.

I will try to keep the code updated in case Google changes the interface and please feel free to raise an issue on GitHub if there are any problems.