import Head from "next/head";

import { useRouter } from "next/router";

import { createReadStream } from "fs";
import { parse } from "fast-csv";

const path = require("path");
const process = require("process");
const CSV_PATH = path.join(process.cwd(), "melinh.csv");

function PostDetail({ data, url }) {
  const router = useRouter();
  const {
    query: { path },
  } = router;

  const isRedirect =
    typeof window !== "undefined" &&
    (window.location.search ||
      (typeof document !== "undefined" &&
        document.referrer.indexOf("facebook.com") !== -1)) &&
    path
      ? true
      : false;

  if (isRedirect) {
    window.location.href = `${url}`;
  }

  if (!data || !url) {
    return (
      <div>
        <p>Your post is notfound, please contact the admin.</p>
      </div>
    );
  }

  return (
    <div>
      <Head>
        {data.title && <title>{data.title}</title>}
        {data.title && <meta name="og:title" content={data.title} />}
        {data.image && <meta name="og:image" content={data.image} />}
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-tight md:leading-none mb-12 text-center md:text-left">
          {data.title}
        </h1>
        <p>You are being redirected to the post, please wait 1-2 seconds...</p>
      </main>
    </div>
  );
}

async function getCSVFile() {
  const data = [];
  return new Promise((resolve, reject) => {
    createReadStream(CSV_PATH)
      .pipe(parse({ headers: true }))
      .on("error", (err) => {
        reject(err);
      })
      .on("data", (row) => {
        data.push(row);
      })
      .on("end", () => {
        resolve(data);
      });
  });
}

// This gets called on every request
export async function getServerSideProps(context) {
  const { path } = context.params;
  const dataX = await getCSVFile();

  const findItem = dataX.find((x) => x.slug === path);

  if (!findItem || !findItem.url) {
    return {
      props: { data: {}, url: null },
    };
  }

  // redirect by server
  if (context.req.headers.referer) {
    if (context.req.headers.referer.indexOf("facebook.com") !== -1) {
      context.res.setHeader("location", `${findItem.url}`);
      context.res.statusCode = 301;
      context.res.end();
      return {
        props: { data: {}, url: null },
      };
    }
  }

  return {
    props: {
      data: {
        title: findItem.title,
        image: findItem.image,
      },
      url: findItem.url,
    },
  };
}

export default PostDetail;
