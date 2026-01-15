// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

const { version: coreVersion } = require("../../packages/core/package.json");
const DOCS_RELEASE_VERSION = `v${coreVersion}`;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Autometa",
  tagline: "An Automation Framework Toolkit",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: "https://bendat.github.io",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/autometa/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "bendat", // Usually your GitHub org/user name.
  projectName: "autometa", // Usually your repo name.

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          editUrl: "https://github.com/Bendat/autometa/tree/main/documentation/website",
          versions: {
            current: {
              label: DOCS_RELEASE_VERSION,
              path: DOCS_RELEASE_VERSION,
              banner: "unreleased",
            },
            legacy: {
              label: "Legacy (v0)",
              path: "legacy",
              banner: "unmaintained",
            },
          },
        },
        blog: {
          showReadingTime: true,
          editUrl: "https://github.com/Bendat/autometa/tree/main/documentation/website",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themes: ["@docusaurus/theme-mermaid"],

  markdown: {
    mermaid: true,
  },

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: "img/docusaurus-social-card.jpg",
      navbar: {
        title: "Autometa",
        logo: {
          alt: "Docusaurus logo",
          src: "img/logo.svg",
        },
        items: [
          {
            to: `/docs/${DOCS_RELEASE_VERSION}/intro`,
            position: "left",
            label: "Overview",
          },
          {
            to: `/docs/${DOCS_RELEASE_VERSION}/getting-started/intro`,
            position: "left",
            label: "Getting started",
          },
          {
            to: `/docs/${DOCS_RELEASE_VERSION}/architecture/runtime`,
            position: "left",
            label: "Architecture",
          },
          {
            to: `/docs/${DOCS_RELEASE_VERSION}/reference/configuration`,
            position: "left",
            label: "Reference",
          },
          { type: "docsVersionDropdown", position: "right" },
          { to: "/blog", label: "Blog", position: "right" },
          {
            href: "https://github.com/bendat/autometa",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Docs",
            items: [
              {
                label: "Overview",
                to: `/docs/${DOCS_RELEASE_VERSION}/intro`,
              },
            ],
          },
          {
            title: "Community",
            items: [
              {
                label: "Stack Overflow",
                href: "https://stackoverflow.com/questions/tagged/docusaurus",
              },
              {
                label: "Discord",
                href: "https://discordapp.com/invite/docusaurus",
              },
              {
                label: "Twitter",
                href: "https://twitter.com/docusaurus",
              },
            ],
          },
          {
            title: "More",
            items: [
              {
                label: "Blog",
                to: "/blog",
              },
              {
                label: "GitHub",
                href: "https://github.com/bendat/autometa",
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
