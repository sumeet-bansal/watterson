import { Client } from '@elastic/elasticsearch';
import * as documents from './complete_calvin_and_hobbes.json';
import * as env from 'dotenv';

env.config();

const client = new Client({ node: process.env.ELASTICSEARCH_CLUSTER });

(async () => {
  for (const i in documents) {
    const comic = documents[i];
    await client.index({ index: 'calvin-and-hobbes', body: comic });
    console.log(`inserted ${comic.date.human_readable}`);
  }
})();
