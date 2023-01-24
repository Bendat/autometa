"use strict";(self.webpackChunkautometa=self.webpackChunkautometa||[]).push([[870],{9613:(e,t,n)=>{n.d(t,{Zo:()=>p,kt:()=>g});var a=n(9496);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var c=a.createContext({}),s=function(e){var t=a.useContext(c),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},p=function(e){var t=s(e.components);return a.createElement(c.Provider,{value:t},e.children)},m="mdxType",d={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},u=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,o=e.originalType,c=e.parentName,p=l(e,["components","mdxType","originalType","parentName"]),m=s(n),u=r,g=m["".concat(c,".").concat(u)]||m[u]||d[u]||o;return n?a.createElement(g,i(i({ref:t},p),{},{components:n})):a.createElement(g,i({ref:t},p))}));function g(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var o=n.length,i=new Array(o);i[0]=u;var l={};for(var c in t)hasOwnProperty.call(t,c)&&(l[c]=t[c]);l.originalType=e,l[m]="string"==typeof e?e:r,i[1]=l;for(var s=2;s<o;s++)i[s]=n[s];return a.createElement.apply(null,i)}return a.createElement.apply(null,n)}u.displayName="MDXCreateElement"},8538:(e,t,n)=>{n.r(t),n.d(t,{contentTitle:()=>c,default:()=>d,frontMatter:()=>l,metadata:()=>s,toc:()=>p});var a=n(5882),r=n(950),o=(n(9496),n(9613)),i=["components"],l={},c="A Simple Article",s={unversionedId:"ui-testing/page-component-model/practical-examples/an-article",id:"ui-testing/page-component-model/practical-examples/an-article",title:"A Simple Article",description:"Assume we have a Page with the following DOM, with",source:"@site/docs/2_ui-testing/1_page-component-model/practical-examples/1_an-article.md",sourceDirName:"2_ui-testing/1_page-component-model/practical-examples",slug:"/ui-testing/page-component-model/practical-examples/an-article",permalink:"/autometa/docs/ui-testing/page-component-model/practical-examples/an-article",editUrl:"https://github.com/Bendat/autometa/docs/2_ui-testing/1_page-component-model/practical-examples/1_an-article.md",tags:[],version:"current",sidebarPosition:1,frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Collections And Containers",permalink:"/autometa/docs/ui-testing/page-component-model/collections-containers"},next:{title:"Forms",permalink:"/autometa/docs/ui-testing/page-component-model/practical-examples/forms"}},p=[],m={toc:p};function d(e){var t=e.components,n=(0,r.Z)(e,i);return(0,o.kt)("wrapper",(0,a.Z)({},m,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"a-simple-article"},"A Simple Article"),(0,o.kt)("p",null,"Assume we have a Page with the following DOM, with\nno classes or IDs"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-html"},'<body>\n  <article>\n    <header>\n      <h1>this is an article</h1>\n      <p>isn\'t that just neat</p>\n    </header>\n    <p>This is my article</p>\n    <a href="./learn-more"><em>Learn More</em></a>\n  </article>\n</body>\n')),(0,o.kt)("p",null,"To start we can build our Page. Since there are no other\nComponents under ",(0,o.kt)("inlineCode",{parentName:"p"},"body"),", we can skip a level of nesting\nand access the article contents directly from the page. For\na page with multiple containers like this, they should\neach be given their own Component - this reduces ambiguity\nand simplifies locators."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"export class MyPage {}\n")),(0,o.kt)("p",null,"Next we will create our Header Component:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"export class ArticleHeader extends Component {\n  @component(By.css('h1'))\n  title: Heading1;\n\n  @component(By.css('p'))\n  blurb: Paragraph;\n}\n")),(0,o.kt)("p",null,"And attach it to our page"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"export class MyPage {\n  @component(By.css('header'))\n  header: ArticleHeader;\n}\n")),(0,o.kt)("p",null,"Next we add our outer paragraph. The locator ",(0,o.kt)("inlineCode",{parentName:"p"},"By.css('p')")," won't\nwork as it will first find the paragraph inside the header. Instead\nwe can look for adjacency ",(0,o.kt)("inlineCode",{parentName:"p"},"By.css('header+p')")),(0,o.kt)("div",{className:"admonition admonition-info alert alert--info"},(0,o.kt)("div",{parentName:"div",className:"admonition-heading"},(0,o.kt)("h5",{parentName:"div"},(0,o.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,o.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,o.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"}))),"info")),(0,o.kt)("div",{parentName:"div",className:"admonition-content"},(0,o.kt)("p",{parentName:"div"},"Strategies like ",(0,o.kt)("inlineCode",{parentName:"p"},"By.css('>p')")," seem to work on some selenium implementations but not on ",(0,o.kt)("inlineCode",{parentName:"p"},"node")))),(0,o.kt)("p",null,"We can also add our ",(0,o.kt)("inlineCode",{parentName:"p"},"<a>")," anchor."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"export class MyPage {\n  @component(By.css('header'))\n  header: ArticleHeader;\n\n  @component(By.css('header+p'))\n  mainParagraph: Paragraph;\n\n  @component(By.css('a'))\n  learnMoreLink: Anchor;\n}\n")),(0,o.kt)("p",null,"Now we're ready to write tests. Our test will simply\nassert that all the text fields hold their expected value"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"const url = process.env.MY_URL;\nconst wdBuilder = new Builder().forBrowser(Browser.Chrome);\nconst site = Site(url, wdBuilder);\n\ndescribe('Validating text on my page', () => {\n  let page: MyPage;\n\n  beforeEach(async () => {\n    page = await site.browse(MyPage);\n  });\n  it('should verify the article is correct', async () => {\n    const { title, blurb } = page.header;\n    const { mainParagraph, learnMoreLink } = page;\n\n    expect(await title.text).toBe('this is an article');\n    expect(await blurb.text).toBe(\"isn't that just neat\");\n    expect(await mainParagraph.text).toBe('This is my article');\n    expect(await learnMoreL.text).toBe('Learn More');\n  });\n\n  it('should follow the learn more link', async () => {\n    const { learnMoreLink } = page;\n\n    await learnMoreLink.click();\n    await page.waitForTitleIs('Learn More About My Article');\n  });\n});\n``;\n")))}d.isMDXComponent=!0}}]);