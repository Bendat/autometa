"use strict";(self.webpackChunk_autometa_documentation=self.webpackChunk_autometa_documentation||[]).push([[1108],{4993:(e,t,n)=>{n.d(t,{Zo:()=>d,kt:()=>h});var r=n(2983);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},i=Object.keys(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var p=r.createContext({}),s=function(e){var t=r.useContext(p),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},d=function(e){var t=s(e.components);return r.createElement(p.Provider,{value:t},e.children)},u="mdxType",c={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},m=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,i=e.originalType,p=e.parentName,d=l(e,["components","mdxType","originalType","parentName"]),u=s(n),m=a,h=u["".concat(p,".").concat(m)]||u[m]||c[m]||i;return n?r.createElement(h,o(o({ref:t},d),{},{components:n})):r.createElement(h,o({ref:t},d))}));function h(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var i=n.length,o=new Array(i);o[0]=m;var l={};for(var p in t)hasOwnProperty.call(t,p)&&(l[p]=t[p]);l.originalType=e,l[u]="string"==typeof e?e:a,o[1]=l;for(var s=2;s<i;s++)o[s]=n[s];return r.createElement.apply(null,o)}return r.createElement.apply(null,n)}m.displayName="MDXCreateElement"},5970:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>p,contentTitle:()=>o,default:()=>c,frontMatter:()=>i,metadata:()=>l,toc:()=>s});var r=n(3050),a=(n(2983),n(4993));const i={sidebar_position:9},o="Writing Step Definitions - Putting it Together",l={unversionedId:"cucumber/test_runner/api-testing/writing-step-definitions",id:"cucumber/test_runner/api-testing/writing-step-definitions",title:"Writing Step Definitions - Putting it Together",description:"Let's recap on what are code approximately looks like (your exact layout and names will differ):",source:"@site/docs/cucumber/test_runner/api-testing/writing-step-definitions.mdx",sourceDirName:"cucumber/test_runner/api-testing",slug:"/cucumber/test_runner/api-testing/writing-step-definitions",permalink:"/autometa/docs/cucumber/test_runner/api-testing/writing-step-definitions",draft:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/cucumber/test_runner/api-testing/writing-step-definitions.mdx",tags:[],version:"current",sidebarPosition:9,frontMatter:{sidebar_position:9},sidebar:"cucumberRunnerBar",previous:{title:"Writing Gherkin",permalink:"/autometa/docs/cucumber/test_runner/api-testing/writing-gherkin-get-product"}},p={},s=[{value:"Schemas",id:"schemas",level:2},{value:"Types",id:"types",level:2},{value:"DTO",id:"dto",level:2},{value:"Builder",id:"builder",level:2},{value:"Controller",id:"controller",level:2},{value:"Static",id:"static",level:2},{value:"Expression Parameter Types",id:"expression-parameter-types",level:2},{value:"API",id:"api",level:2},{value:"World",id:"world",level:2},{value:"App",id:"app",level:2},{value:"Types",id:"types-1",level:2},{value:"Declaration Overrides",id:"declaration-overrides",level:2},{value:"Config",id:"config",level:2},{value:"Env",id:"env",level:2},{value:"Step Definitions",id:"step-definitions",level:2},{value:"Given",id:"given",level:3},{value:"When",id:"when",level:3},{value:"Then",id:"then",level:3},{value:"Builder",id:"builder-1",level:4},{value:"Table",id:"table",level:4}],d={toc:s},u="wrapper";function c(e){let{components:t,...n}=e;return(0,a.kt)(u,(0,r.Z)({},d,n,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"writing-step-definitions---putting-it-together"},"Writing Step Definitions - Putting it Together"),(0,a.kt)("p",null,"Let's recap on what are code approximately looks like (your exact layout and names will differ):"),(0,a.kt)("h2",{id:"schemas"},"Schemas"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'// src/controllers/product/product.schema.ts\nimport { string, number, object, array } from "myzod";\n\nexport const ProductSchema = object({\n  id: number(),\n  title: string(),\n  description: string(),\n  price: number(),\n  discountPercentage: number(),\n  rating: number(),\n  stock: number(),\n  brand: string(),\n  category: string(),\n  thumbnail: string(),\n  images: array(string())\n});\n')),(0,a.kt)("h2",{id:"types"},"Types"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'// src/controllers/product/product.types.ts\nimport { Infer } from "myzod";\nimport {\n  CategoriesSchema,\n  ProductListSchema,\n  ProductSchema\n} from "./product.schema";\nimport { HTTPResponse } from "@autometa/runner";\n\nexport type Product = Infer<typeof ProductSchema>;\nexport type ProductResponse = HTTPResponse<Product>;\nexport type ProductList = Infer<typeof ProductListSchema>;\nexport type ProductListResponse = HTTPResponse<ProductList>;\nexport type Categories = Infer<typeof CategoriesSchema>;\nexport type CategoriesResponse = HTTPResponse<Categories>;\n')),(0,a.kt)("h2",{id:"dto"},"DTO"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'// src/controllers/product/product.dto.ts\nimport { Product } from "./product.types";\nexport class ProductDTO extends DTO(Product) {}\n')),(0,a.kt)("h2",{id:"builder"},"Builder"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'// src/controllers/product/product.builder.ts\nimport { Builder } from "@autometa/dto-builder";\nimport { ProductDTO } from "./product.dto";\n\nexport class ProductBuilder extends Builder(ProductDTO) {}\n')),(0,a.kt)("h2",{id:"controller"},"Controller"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'// src/controllers/product/product.controller.ts\nimport { Fixture, HTTP } from "@autometa/runner";\nimport { Product } from "./product.types";\nimport { ProductSchema } from "./product.schema";\nimport { Env } from "../../apps";\n\n@Fixture\n@Constructor(HTTP)\nexport class ProductController {\n  constructor(readonly http: HTTP) {\n    this.http.url(Env.API_URL).sharedRoute(\'products\').requireSchema(true);\n  }\n\n  view(id: number) {\n    return this.http\n      .route(id)\n      .schema(ProductSchema, 200)\n      .get<Product>();\n  }\n}\n')),(0,a.kt)("h2",{id:"static"},"Static"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'export const ProductIdMap = {\n  "iPhone 9": 1\n} as const;\n\nexport type ProductId = (typeof ProductIdMap)[keyof typeof ProductIdMap];\n')),(0,a.kt)("h2",{id:"expression-parameter-types"},"Expression Parameter Types"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'// src/controllers/product/product.params.ts\nimport {\n  camel,\n  convertPhrase,\n  defineParameterType,\n} from "@autometa/runner";\nimport { ProductBuilder } from "./product.builder";\nimport { ProductIdMap } from "./product.static";\ndefineParameterType(\n  {\n    name: "builder:product",\n    regexpPattern: [/\'([^\']*)\'/, /"([^"]*)"/],\n    transform: (value) => new ProductBuilder().title(value)\n  },\n  {\n    name: "product:property",\n    regexpPattern: [/\'([^\']*)\'/, /"([^"]*)"/, /[^\\s]+/],\n    transform: (value) => convertPhrase(value, camel)\n  },\n  {\n    name: "product:static:name",\n    regexpPattern: [/\'([^\']*)\'/, /"([^"]*)"/],\n    transform: (value) => {\n      return ProductIdMap[value];\n    }\n  }\n);\n')),(0,a.kt)("h2",{id:"api"},"API"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'// src/controllers/api.ts\nimport { Fixture, Constructor } from "@autometa/runner";\nimport { ProductController } from "./product";\n\n@Fixture\n@Constructor(ProductController)\nexport class API {\n  constructor(readonly products: ProductController) {}\n}\n')),(0,a.kt)("h2",{id:"world"},"World"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'// src/controllers/product/product.world.ts\nimport { AutometaWorld } from "@autometa/runner";\nimport type { ProductId, ProductResponse } from "../controllers/product";\n\nexport class World extends AutometaWorld {\n  declare viewProductId: ProductId;\n  declare viewProductResponse: ProductResponse;\n}\n')),(0,a.kt)("h2",{id:"app"},"App"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'import { AppType } from "@autometa/runner";\nimport { World } from "./default.world";\nimport { API } from "../controllers/api";\n\n@AppType(World)\n@Constructor(API)\nexport class App {\n  constructor(readonly api: API) {}\n}\n')),(0,a.kt)("h2",{id:"types-1"},"Types"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'// src/app/autometa.types.ts\nimport type { ProductBuilder, Product, ProductId } from "../controllers";\nimport { World } from "./default.world";\n\nexport interface Types {\n  "builder:product": ProductBuilder;\n  "product:property": keyof Product;\n  "product:static:name": ProductId;\n}\n')),(0,a.kt)("h2",{id:"declaration-overrides"},"Declaration Overrides"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'// typings/autometa.d.ts\n/* eslint-disable @typescript-eslint/no-empty-interface */\nimport type { App as A, World as W, Types as T } from "./src";\n\ndeclare module "@autometa/runner" {\n  export interface App extends A {}\n  export interface World extends W {}\n  export interface Types extends T {}\n}\n')),(0,a.kt)("h2",{id:"config"},"Config"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'// autometa.config.ts\nimport { defineConfig } from "@autometa/runner";\ndefineConfig({\n  runner: "jest",\n  environment: "default",\n  test: {\n    groupLogging: true,\n    timeout: 10000\n  },\n  events: [],\n  roots: {\n    features: ["integration/features"],\n    steps: ["integration/steps"],\n    app: ["src"],\n    parameterTypes: ["*.params.ts"]\n  },\n  shim: {\n    errorCause: true\n  }\n});\n')),(0,a.kt)("h2",{id:"env"},"Env"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'// src/app/env.ts\nimport { cleanEnv, str } from "envalid";\nimport dotenv from "dotenv";\ndotenv.config();\nexport const Env = cleanEnv(process.env, {\n  API_URL: str({\n    example: "https://example.com",\n    default: "https://dummyjson.com"\n  })\n});\n')),(0,a.kt)("h1",{id:"gherkin"},"Gherkin"),(0,a.kt)("p",null,"We also have the following gherkin. We will create the same scenario, with two\ndifferent approaches to ",(0,a.kt)("inlineCode",{parentName:"p"},"Then")," step validation."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-gherkin"},"// integration/features/product/view-product.feature\nFeature: Viewing a Product\n\n    Scenario: I view an iPhone (builder)\n        Given I want to view the product 'iPhone 9'\n        When I view the product\n        Then the product description is \"An apple mobile which is nothing like apple\"\n        And the product price is 549\n        * the product 'discount percentage' is 12.96\n        * the product brand is 'Apple'\n\n\n    Scenario: I view an iPhone (table)\n        Given I want to view the product 'iPhone 9'\n        When I view the product\n        Then the product has the expected details\n            | description | An apple mobile which is nothing like apple |\n            | price       | 549                                         |\n            | discount    | 12.96                                       |\n            | brand       | Apple                                       |\n")),(0,a.kt)("h2",{id:"step-definitions"},"Step Definitions"),(0,a.kt)("p",null,"With everything in place we can start writing step definitions for our gherkin, starting with the ",(0,a.kt)("inlineCode",{parentName:"p"},"Given")," step."),(0,a.kt)("h3",{id:"given"},"Given"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'// integration/steps/product/given.steps.ts\nimport { Given } from "@autometa/runner";\n\nGiven(\n  "I want to view the product {product:static:name}",\n  (productId, { world }) => {\n    world.viewProductId = productId;\n  }\n);\n')),(0,a.kt)("p",null,"Here we use the ",(0,a.kt)("inlineCode",{parentName:"p"},"product:static:name")," expression parameter type we defined, which converts\nthe phone product ",(0,a.kt)("inlineCode",{parentName:"p"},"iPhone 9")," to it's static id ",(0,a.kt)("inlineCode",{parentName:"p"},"1"),". We then store this in the world\nso we can access it when we wish to execute our request."),(0,a.kt)("h3",{id:"when"},"When"),(0,a.kt)("p",null,"Here we simply grab the product ID we stored, and access the ",(0,a.kt)("inlineCode",{parentName:"p"},"product")," controller."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'// integration/steps/product/when.steps.ts\nimport { When } from "@autometa/runner";\n\nWhen("I view the product", ({ world, app: { api: products } }) => {\n  world.viewProductResponse = await products.view(world.viewProductId);\n});\n')),(0,a.kt)("p",null,"If the response does not match the schema we provided, or it returns an unexpected status code, the test will fail here.\nOtherwise, the response object will be stored in the World. This can be accessed by ",(0,a.kt)("inlineCode",{parentName:"p"},"Then")," steps to validate data."),(0,a.kt)("h3",{id:"then"},"Then"),(0,a.kt)("p",null,"We have two different approaches to implement here. The first is a builder style, using ",(0,a.kt)("inlineCode",{parentName:"p"},"And")," and list style ",(0,a.kt)("inlineCode",{parentName:"p"},"*")," steps\nto dynamically validate individual properties of the response."),(0,a.kt)("h4",{id:"builder-1"},"Builder"),(0,a.kt)("p",null,"Using a builder style pattern, we simply extract the response property we want to validate,\nand an expected value it should match."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'// integration/steps/product/then.steps.ts\nimport { Then, VTable } from "@autometa/runner";\n\nThen(\n  "the product {product:property} is {primitive}",\n  (target, value, { world }) => {\n    const { data: product } = world.viewProductResponse;\n    expect(product[target]).toEqual(value);\n  }\n);\n')),(0,a.kt)("p",null,"For this, we use the ",(0,a.kt)("inlineCode",{parentName:"p"},"product:property")," expression we defined to access a value from\nthe reponse Product object. The ",(0,a.kt)("inlineCode",{parentName:"p"},"primitive")," parameter type is included by default with autometa.\nIt will attempt to parse a variety of Cucumber Expressions and convert them into one of the following types:"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("inlineCode",{parentName:"li"},"string"),(0,a.kt)("ul",{parentName:"li"},(0,a.kt)("li",{parentName:"ul"},"If no other match is found, the value will be returned as a string."))),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("inlineCode",{parentName:"li"},"number"),(0,a.kt)("ul",{parentName:"li"},(0,a.kt)("li",{parentName:"ul"},"If the value is a number not in quotes, it will be converted to a number type."),(0,a.kt)("li",{parentName:"ul"},"Comma delimiters are permitted, e.g. ",(0,a.kt)("inlineCode",{parentName:"li"},"1,000")," will be converted to ",(0,a.kt)("inlineCode",{parentName:"li"},"1000")," and ",(0,a.kt)("inlineCode",{parentName:"li"},"1,000.50")," will be converted to ",(0,a.kt)("inlineCode",{parentName:"li"},"1000.5"),"."),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("inlineCode",{parentName:"li"},"Infinity"),", ",(0,a.kt)("inlineCode",{parentName:"li"},"-Infinity")," and ",(0,a.kt)("inlineCode",{parentName:"li"},"NaN")," will be converted to their respective types."))),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("inlineCode",{parentName:"li"},"boolean"),(0,a.kt)("ul",{parentName:"li"},(0,a.kt)("li",{parentName:"ul"},"The words ",(0,a.kt)("inlineCode",{parentName:"li"},"true")," and ",(0,a.kt)("inlineCode",{parentName:"li"},"false")," will be converted to boolean types, but some other words will also transform into booleans",(0,a.kt)("ul",{parentName:"li"},(0,a.kt)("li",{parentName:"ul"},"enabled, disabled"),(0,a.kt)("li",{parentName:"ul"},"active, inactive"),(0,a.kt)("li",{parentName:"ul"},"on, off"))))),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("inlineCode",{parentName:"li"},"null"),(0,a.kt)("ul",{parentName:"li"},(0,a.kt)("li",{parentName:"ul"},"The word ",(0,a.kt)("inlineCode",{parentName:"li"},"null")," will be converted to a null type."))),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("inlineCode",{parentName:"li"},"undefined"),(0,a.kt)("ul",{parentName:"li"},(0,a.kt)("li",{parentName:"ul"},"The word ",(0,a.kt)("inlineCode",{parentName:"li"},"undefined")," will be converted to an undefined type.",(0,a.kt)("ul",{parentName:"li"},(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("inlineCode",{parentName:"li"},"missing")," will also become undefined."))))),(0,a.kt)("li",{parentName:"ul"},"date strings",(0,a.kt)("ul",{parentName:"li"},(0,a.kt)("li",{parentName:"ul"},"date strings in the format ",(0,a.kt)("inlineCode",{parentName:"li"},"YYYY-MM-DD")," will be converted to a date type."),(0,a.kt)("li",{parentName:"ul"},"datetime strings in the format ",(0,a.kt)("inlineCode",{parentName:"li"},"YYYY-MM-DDTHH:mm:ss:msZ")," will be converted to a date type."),(0,a.kt)("li",{parentName:"ul"},"certain words or phrases corresponding to time:",(0,a.kt)("ul",{parentName:"li"},(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("inlineCode",{parentName:"li"},"today"),", ",(0,a.kt)("inlineCode",{parentName:"li"},"tomorrow"),", ",(0,a.kt)("inlineCode",{parentName:"li"},"yesterday"),", ",(0,a.kt)("inlineCode",{parentName:"li"},"after tomorrow"),", ",(0,a.kt)("inlineCode",{parentName:"li"},"last fortnight"),", ",(0,a.kt)("inlineCode",{parentName:"li"},"next week")," etc will attempt to create a date matching those literals in time from now."),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("inlineCode",{parentName:"li"},"now")," will create a date matching the current time."),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("inlineCode",{parentName:"li"},"'5 days'")," and ",(0,a.kt)("inlineCode",{parentName:"li"},"'5 days from now'")," will create a date 5 days from now.",(0,a.kt)("ul",{parentName:"li"},(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("inlineCode",{parentName:"li"},"'5 days ago'")," will create a date 5 days ago."),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("inlineCode",{parentName:"li"},"years"),", ",(0,a.kt)("inlineCode",{parentName:"li"},"months"),", ",(0,a.kt)("inlineCode",{parentName:"li"},"weeks"),", ",(0,a.kt)("inlineCode",{parentName:"li"},"days"),", ",(0,a.kt)("inlineCode",{parentName:"li"},"hours"),", ",(0,a.kt)("inlineCode",{parentName:"li"},"minutes"),", ",(0,a.kt)("inlineCode",{parentName:"li"},"seconds")," and ",(0,a.kt)("inlineCode",{parentName:"li"},"milliseconds")," are all valid units for this pattern.")))))))),(0,a.kt)("p",null,"The primitive type is not intended to replace all types, but it does enable builder patterns in your\nsteps without duplication the same step definition with different ",(0,a.kt)("inlineCode",{parentName:"p"},"{paramaterType}"),"s to extract the value."),(0,a.kt)("p",null,"This will match the ",(0,a.kt)("inlineCode",{parentName:"p"},"Then"),", ",(0,a.kt)("inlineCode",{parentName:"p"},"And")," and ",(0,a.kt)("inlineCode",{parentName:"p"},"*")," steps in our gherkin file, and other tests with\nother focuses can choose to run the same initital test but validate other properties more related\nto the tests purpose."),(0,a.kt)("p",null,"We end up with a list of assertions we want to make on our data."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-gherkin"},"    Then the product description is \"An apple mobile which is nothing like apple\"\n    And the product price is 549\n    * the product 'discount percentage' is 12.96\n    * the product brand is 'Apple'\n")),(0,a.kt)("admonition",{type:"info"},(0,a.kt)("p",{parentName:"admonition"},"In the above example the ",(0,a.kt)("inlineCode",{parentName:"p"},"{product:property}")," expression can be seen matching single words without strings,\nor multiple words wrapped in quotes. The way our expression was defined, it will not match ",(0,a.kt)("inlineCode",{parentName:"p"},"discount percentage"),"\nwithout quotes."),(0,a.kt)("p",{parentName:"admonition"},"However if you don't mind exposing implementation details, you can match ",(0,a.kt)("inlineCode",{parentName:"p"},"discountPercentage")," without quotes.")),(0,a.kt)("h4",{id:"table"},"Table"),(0,a.kt)("p",null,"If instead we want to have a consistent data set from our response that we want to verify,\nwe can define that behavior with a step with a table."),(0,a.kt)("p",null,"In our case we chose a vertical table, or ",(0,a.kt)("inlineCode",{parentName:"p"},"VTable"),". A vertical table has it's titles\nas the first column, and the rest of the row is its values."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},"Then the product has the expected details\n    | description | An apple mobile which is nothing like apple |\n    | price       | 549                                         |\n    | discount    | 12.96                                       |\n    | brand       | Apple                                       |\n")),(0,a.kt)("admonition",{type:"tip"},(0,a.kt)("p",{parentName:"admonition"},"Other table types are supported.\n",(0,a.kt)("inlineCode",{parentName:"p"},"HTable")," is a standard table with horizontal headers on the first row:"),(0,a.kt)("pre",{parentName:"admonition"},(0,a.kt)("code",{parentName:"pre",className:"language-gherkin"},"Then the product has the expected details\n    | description | price | discount | brand |\n    | An apple mobile which is nothing like apple | 549 | 12.96 | Apple |\n")),(0,a.kt)("p",{parentName:"admonition"},"An ",(0,a.kt)("inlineCode",{parentName:"p"},"MTable")," or matrix table tracks individual cells against both a vertical and horizontal\nheader, such as matching ",(0,a.kt)("inlineCode",{parentName:"p"},"Severity")," to ",(0,a.kt)("inlineCode",{parentName:"p"},"Likelyhood"),", i.e how likely something is to happen\nvs how much impact it has, or matching attributes like the ",(0,a.kt)("inlineCode",{parentName:"p"},"hardness")," of an object to the color,\nlike ",(0,a.kt)("inlineCode",{parentName:"p"},"blue and tough = diamond"),", 'blue and soft = water', 'red and tough = ruby', 'red and soft = tomato' etc."),(0,a.kt)("pre",{parentName:"admonition"},(0,a.kt)("code",{parentName:"pre",className:"language-gherkin"},"Then we have a matrix table of color and hardness for some reason\n    |      | red    | blue    |\n    | hard | ruby   | diamond |\n    | soft | tomato | water   |\n")),(0,a.kt)("p",{parentName:"admonition"},"A List table or ",(0,a.kt)("inlineCode",{parentName:"p"},"ListTable")," is just a raw list with no presumed headers."),(0,a.kt)("pre",{parentName:"admonition"},(0,a.kt)("code",{parentName:"pre",className:"language-ts"},"Then I have a list of lists\n    |  1 | 2 | 3 |\n    |  4 | 5 | 6 |\n    | -1 | 4 | 2 |\n")),(0,a.kt)("p",{parentName:"admonition"},(0,a.kt)("strong",{parentName:"p"},"Casting"),": By Default autometa will attempt to parse numbers and booleans from a table into\ntheir respective type. If you want to disable this behavior, you can pass ",(0,a.kt)("inlineCode",{parentName:"p"},"false")," as the last\nargument to the ",(0,a.kt)("inlineCode",{parentName:"p"},".get")," method, which will return the raw string."),(0,a.kt)("p",{parentName:"admonition"},(0,a.kt)("inlineCode",{parentName:"p"},".get")," can return either an entire row/column or just a cells"),(0,a.kt)("pre",{parentName:"admonition"},(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'Given(\n  "a step with a VTablel",\n  (table) => {\n    const row = table.get("foo");\n    const firstFoo = table.get("foo", 0);\n    const rawRow = table.get("foo", false);\n    const rawFirstFoo = table.get("foo", 0, false);\n  },\n  VTable\n);\n'))),(0,a.kt)("p",null,"We can extract our values from out VTable now. Since we only have one cell per header,\nwe can directly access it with an index ",(0,a.kt)("inlineCode",{parentName:"p"},"0"),". In other situations, you could forgo\nthe index and have an iterable array or for loop. If your step is getting complicated,\nconsider making a new Fixture to encapsulate that behavior, so step definitions can\nbe kept simple and declarative."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},'Then(\n  "the product has the expected details",\n  (table, { world }) => {\n    const {\n      data: { description, price, discountPercentage, brand }\n    } = world.viewProductResponse;\n    const expectedDescription = table.get<string>("description", 0);\n    const expectedPrice = table.get<number>("price", 0);\n    const expectedDiscount = table.get<number>("discount", 0);\n    const expectedBrand = table.get<string>("brand", 0);\n\n    expect(description).toEqual(expectedDescription);\n    expect(price).toEqual(expectedPrice);\n    expect(discountPercentage).toEqual(expectedDiscount);\n    expect(brand).toEqual(expectedBrand);\n  },\n  VTable\n);\n')),(0,a.kt)("p",null,"With that we've fully implemented our first test. Full source code for this example,\nincluding more endpoints and controllers can be found in the ",(0,a.kt)("a",{parentName:"p",href:"https://github.com/bendat/autometa"},"Github Repository"),"\nunder the ",(0,a.kt)("inlineCode",{parentName:"p"},"__examples__/api-tests-example")," directory."),(0,a.kt)("p",null,"We can run our test on the command line with  ",(0,a.kt)("inlineCode",{parentName:"p"},"npx jest integration/features/product/view-product.feature")),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-bash"}," PASS  integration/features/product/view-product.feature (9.5 s)\n  Viewing a Product\n    \u2713 I view an iPhone (builder) (3 ms)\n    \u2713 I view an iPhone (table) (1 ms)\n\n  Test Suites: 1 passed, 1 total\n  Tests:       2 passed, 2 total\n  Snapshots:   0 total\n  Time:        10.016 s\n  Ran all test suites matching /integration\\/features\\/product\\/view-product.feature/i.\n")))}c.isMDXComponent=!0}}]);