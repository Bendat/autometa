import { Given, Then, When } from "@autometa/cucumber";

Given('a registered user', ()=>{
    console.log('given a registered user')
})

When("they enter their username '{word}'", (username: string)=>{
    console.log('when username '+username)
})

When("they enter their password '{word}'", (password: string)=>{
    console.log('when password' + password)
})

Then('they are presented with their profile', ()=>{
    console.log('profile presented')
})
Then('an error is displayed', ()=>{
    console.log('error displayed')
})
