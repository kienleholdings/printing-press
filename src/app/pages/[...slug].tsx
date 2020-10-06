import { promises as fsPromises } from 'fs';
import { GetStaticPaths, GetStaticPropsResult } from 'next';
import { join, resolve } from 'path';
import globby from 'globby';
import slash from 'slash';

import React from 'react';

interface Props {
  page: string;
}

const App: React.FC<Props> = ({ page }) => <div>{JSON.stringify(page)}</div>;

const getContentAndUrls = async () => {
  const contentPath = resolve('temp', 'content', '**', '*.md');
  const fileNames = await globby(contentPath);
  const pages = await Promise.all(
    fileNames.map(async (file) => {
      return fsPromises.readFile(file).then((res) => ({
        // Take the file name and reduce it to the relative path of /content and remove md
        // extension. This is essentially converting file names into routes
        name: slash(file.split(join('temp', 'content'))[1].slice(1, -3).toLowerCase()).split('/'),
        value: res.toString(),
      }));
    })
  );

  return pages;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = (await getContentAndUrls()).map((page) => ({
    params: {
      slug: page.name,
    },
  }));

  return {
    paths,
    fallback: false,
  };
};

interface GetStaticPropsContext {
  params: {
    slug: string[];
  };
}

export const getStaticProps = async (
  ctx: GetStaticPropsContext
): Promise<GetStaticPropsResult<Props>> => {
  const builtSlug = ctx.params.slug.join('/');
  const page = (await getContentAndUrls())
    .map((currentPage) => ({
      name: currentPage.name.join('/'),
      value: currentPage.value,
    }))
    .filter((currentPage) => currentPage.name === builtSlug)[0].value;

  return {
    props: {
      page,
    },
  };
};

export default App;
