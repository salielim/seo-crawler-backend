'use strict';
const HCCrawler = require('headless-chrome-crawler');

exports.crawl = (req, res) => {
  // {"queueUrl": "http://books.toscrape.com"}
  console.log('req.body')
  const { queueUrl } = req.body;

  (async () => {
    var visitedURLs = [];
    var dataArr = [];
    const crawler = await HCCrawler.launch({
      headless: true, 
      args:['--no-sandbox'],
      // Function to be evaluated in browsers
      evaluatePage: () => ({
        url: $(location).attr('href'),
        title: $('title').text(),
        metaDescription: $('meta[property="og:description"]').attr('content'),
        h1: $('h1').text(),
        h2: $('h2').text()
      }),
      // Function to be called with evaluated results from browsers
      onSuccess: async (result) => {
        // save them as wish
        visitedURLs.push(result.options.url);
        // show some progress
        console.log(visitedURLs.length, result.options.url);
        // queue new links one by one asynchronously
        for (const link of result.links) {
          await crawler.queue({
            url: link,
            maxDepth: 1
          });
        }
        dataArr.push(result.result);
      },
      // catch all errors
      onError: (error) => {
        console.log(error);
      }
    });

    await crawler.queue({
      url: `${queueUrl}`,
      maxDepth: 0
    });
    crawler.setMaxRequest(3);
    await crawler.onIdle(); // Resolved when no queue is left
    await crawler.close(); // Close the crawler
    await res.send({
      status: {
        code: 200,
        message: 'SUCCESS'
      },
      data: dataArr
    });
  })();
};
