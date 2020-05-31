import { Client, RequestParams, ApiResponse } from '@elastic/elasticsearch';
import * as documents from './complete_calvin_and_hobbes.json';
import * as env from 'dotenv';
import * as express from 'express';
import * as morgan from 'morgan';

env.config();

const client = new Client({ node: process.env.ELASTICSEARCH_CLUSTER });
const app: express.Application = express();

app.use(morgan(':date[web] [IP :req[X-Forwarded-For]] [Flow :res[X-Flow-Id]] '
  + ':method :url :status :response-time[3]ms'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post('/search', async (req, res) => {
  if (!req.body.text || !req.body.range) {
    return res.send({ error: 'Missing \'text\' or \'range\' fields in request body' });
  }

  const text = req.body.text;
  const range = {
    start: !!req.body.range.start ? req.body.range.start : 0,
    end: !!req.body.range.end ? req.body.range.end : Math.floor(Date.now() / 1000),
  };

  const result = await client.search({
    index: 'calvin-and-hobbes',
    body: {
      query: {
        bool: {
          must: {
            multi_match: {
              query: text,
              fields: [ 'script', 'description' ],
            },
          },
          filter: {
            range: {
              'date.timestamp': {
                gte: range.start,
                lte: range.end,
              },
            },
          },
        }
      },
    },
  });
  res.send(result.body.hits.hits);
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
