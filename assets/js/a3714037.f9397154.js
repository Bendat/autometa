"use strict";(self.webpackChunk_autometa_documentation=self.webpackChunk_autometa_documentation||[]).push([[4281],{4993:(e,t,n)=>{n.d(t,{Zo:()=>u,kt:()=>h});var r=n(2983);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var c=r.createContext({}),p=function(e){var t=r.useContext(c),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},u=function(e){var t=p(e.components);return r.createElement(c.Provider,{value:t},e.children)},l="mdxType",d={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},m=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,o=e.originalType,c=e.parentName,u=s(e,["components","mdxType","originalType","parentName"]),l=p(n),m=a,h=l["".concat(c,".").concat(m)]||l[m]||d[m]||o;return n?r.createElement(h,i(i({ref:t},u),{},{components:n})):r.createElement(h,i({ref:t},u))}));function h(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=n.length,i=new Array(o);i[0]=m;var s={};for(var c in t)hasOwnProperty.call(t,c)&&(s[c]=t[c]);s.originalType=e,s[l]="string"==typeof e?e:a,i[1]=s;for(var p=2;p<o;p++)i[p]=n[p];return r.createElement.apply(null,i)}return r.createElement.apply(null,n)}m.displayName="MDXCreateElement"},9709:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>i,default:()=>d,frontMatter:()=>o,metadata:()=>s,toc:()=>p});var r=n(3050),a=(n(2983),n(4993));const o={sidebar_position:7},i="Static Data - Mapping Names to IDs",s={unversionedId:"cucumber/test_runner/api-testing/static-data",id:"cucumber/test_runner/api-testing/static-data",title:"Static Data - Mapping Names to IDs",description:"The endpoint we are looking at currently is products/, which retrieves a product",source:"@site/docs/cucumber/test_runner/api-testing/static-data.mdx",sourceDirName:"cucumber/test_runner/api-testing",slug:"/cucumber/test_runner/api-testing/static-data",permalink:"/autometa/docs/cucumber/test_runner/api-testing/static-data",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/cucumber/test_runner/api-testing/static-data.mdx",tags:[],version:"current",sidebarPosition:7,frontMatter:{sidebar_position:7},sidebar:"cucumberRunnerBar",previous:{title:"Phrases & Hiding Implementation Details",permalink:"/autometa/docs/cucumber/test_runner/api-testing/phrases"},next:{title:"Writing Gherkin",permalink:"/autometa/docs/cucumber/test_runner/api-testing/writing-gherkin-get-product"}},c={},p=[{value:"Using the Static Data With Expressions",id:"using-the-static-data-with-expressions",level:2}],u={toc:p},l="wrapper";function d(e){let{components:t,...n}=e;return(0,a.kt)(l,(0,r.Z)({},u,n,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"static-data---mapping-names-to-ids"},"Static Data - Mapping Names to IDs"),(0,a.kt)("p",null,"The endpoint we are looking at currently is ",(0,a.kt)("inlineCode",{parentName:"p"},"products/{id}"),", which retrieves a product\nresource by it's numeric ID in the database. This makes sense for the API, but we'd\nlike our Gherkin to reflect the product itself."),(0,a.kt)("p",null,"Since we know that in our test environments this resource is static, we can treat it\nas static test data. We can create a mapping object that maps the product name to\nit's ID in the database. Let's make a const dictionary to map product names to IDs"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'// src/controllers/products/product.static.ts\n\nexport const ProductIdMap = {\n  "iPhone 9": 1\n} as const;\n')),(0,a.kt)("admonition",{type:"tip"},(0,a.kt)("p",{parentName:"admonition"},(0,a.kt)("inlineCode",{parentName:"p"},"as const")," marks the object as compile time constant. So it's schema is literal, and not\ncast to a generic type like ",(0,a.kt)("inlineCode",{parentName:"p"},"number"),"."),(0,a.kt)("p",{parentName:"admonition"},"Without const, when hovering over the map in your editor, its shape would be displayed as"),(0,a.kt)("pre",{parentName:"admonition"},(0,a.kt)("code",{parentName:"pre",className:"language-ts"},"{\n    'iPhone 9': number\n}\n")),(0,a.kt)("p",{parentName:"admonition"},"Rather than the literal we want:"),(0,a.kt)("pre",{parentName:"admonition"},(0,a.kt)("code",{parentName:"pre",className:"language-ts"},"{\n    'iPhone 9': 1\n}\n"))),(0,a.kt)("p",null,"If using multiple environments, like dev, test, etc. we\nmight want to set those values with ",(0,a.kt)("inlineCode",{parentName:"p"},"envalid"),", however we will lose the constant type literals."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'// src/controllers/products/product.static.ts\nimport { Env } from "../../app/env";\nexport const ProductIdMap = {\n  "iPhone 9": Env.PRODUCT_ID_IPHONE_9\n};\n\n// src/app/env.ts\nimport { cleanEnv, num, str } from "envalid";\n\nexport const Env = cleanEnv(process.env, {\n  API_URL: str({ default: "http://localhost:3000" }),\n  PRODUCT_ID_IPHONE_9: num({ default: 1 })\n});\n')),(0,a.kt)("h2",{id:"using-the-static-data-with-expressions"},"Using the Static Data With Expressions"),(0,a.kt)("p",null,"We can also take advantage of expressions here to automatically our products\nfrom gherkin."),(0,a.kt)("p",null,"Consider the following step:"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-gherkin"},'Given I have a product named "iPhone 9"\n')),(0,a.kt)("p",null,"We can create a new ",(0,a.kt)("inlineCode",{parentName:"p"},"product:static:name")," expression to map the product name to\nit's corresponding ID and automatically extract it from steps. As before we can\nuse the ",(0,a.kt)("inlineCode",{parentName:"p"},"AssertKey")," to validate the input."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'// src/controllers/products/product.params.ts\nimport { ProductIdMap } from "./product.static";\nimport { defineParameterType } from "@autometa/runner";\n\ndefineParameterType(\n  {\n    name: "product:static:name",\n    regexp: /"(.*)"/,\n    transformer: (name: string) => {\n      AssertKey(ProductIdMap, name, `Product Map name ${name}`);\n      return ProductIdMap[name];\n    }\n  } /* .... */\n);\n')),(0,a.kt)("p",null,"And update our types:"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'import type { App as A, World as W } from "./src";\nimport type {\n  ProductBuilder,\n  Product,\n  ProductId\n} from "./src/controllers/product";\ndeclare module "@autometa/runner" {\n  export interface App extends A {}\n  export interface World extends W {}\n  export interface Types {\n    "builder:product": ProductBuilder;\n    "product:property": keyof Product;\n    "product:static:name": ProductId;\n    "world:property:response": keyof W;\n  }\n}\n\n')),(0,a.kt)("p",null,"Now we can use this expression in our step definition:"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'// src/controllers/products/product.steps.ts\nimport { Given } from "@autometa/runner";\nimport { ProductIdMap } from "./product.static";\n\nGiven(\n  "I want to view the product {product:static:map}",\n  async (id, { world }) => {\n    world.viewProductId = id;\n  }\n);\n')),(0,a.kt)("p",null,"With all that out of the way we can start to write our gherkin tests"))}d.isMDXComponent=!0}}]);