/** @type {import('next').NextConfig} */

// Când rulează în GitHub Actions, site-ul e servit de pe
// https://<user>.github.io/<repo>/  — deci avem nevoie de basePath
// cu numele repo-ului. Local (npm run dev) rămâne gol, fără basePath.
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

let basePath = '';
let assetPrefix = '';

if (isGithubActions && process.env.GITHUB_REPOSITORY) {
  const repo = process.env.GITHUB_REPOSITORY.replace(/.*?\//, '');
  basePath = `/${repo}`;
  assetPrefix = `/${repo}/`;
}

const nextConfig = {
  output: 'export',        // build static, fără server Node — exact ce cere GitHub Pages
  trailingSlash: true,      // necesar pentru rutare corectă pe GitHub Pages
  images: { unoptimized: true },
  basePath,
  assetPrefix,
  reactStrictMode: true,
  env: {
    // expus către client, ca linkurile către fișiere din /public
    // (ex. șablonul de import) să includă basePath-ul corect
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
