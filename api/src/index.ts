import { pipeline } from "node:stream/promises";
import express from "express";
import { Pool } from "pg";
import cors from "cors";
import { from as copyFrom } from "pg-copy-streams";

const main = async () => {
  const pool = new Pool();
  const client = await pool.connect();

  const app = express();
  app.use(cors());

  app.get("/ping", (_, response) => {
    response.json({ ping: "pong" });
  });

  app.post("/datasets/:id", async (request, response) => {
    const table = `items_${request.params.id}`;
    await client.query(
      `CREATE TABLE IF NOT EXISTS ${table} (id varchar(255), at date, value float, longitude float, latitude float);`
    );
    await client.query(`TRUNCATE ${table}`);
    const ingestStream = client.query(
      copyFrom(`COPY ${table} FROM STDIN CSV;`)
    );
    await pipeline(request, ingestStream);
    response.json({ done: true });
  });

  app.listen(process.env.PORT ?? 3001);
};

main();
