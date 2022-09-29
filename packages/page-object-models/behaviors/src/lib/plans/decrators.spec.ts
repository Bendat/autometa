import { Button, component, PageObject, WebPage } from '@autometa/page-components'
import { Component } from 'react'
import { By } from 'selenium-webdriver'
import { text } from 'stream/consumers'
import { ActionOn, Is, Observe, Observer } from '../behaviors'
import  {action, observation, Plans, StepOf} from './'
class TestPage extends WebPage{
    @component(By.id('none'))
    button: Button
}
const observer = Observe(TestPage, ({button})=>button)
const observe2r = Observe(observer, (p)=>)
const firstAction = ActionOn(observer, ()=>true)
const secondAction = ActionOn(observer, ()=>true)

class TestPlans extends Plans{
    @action(ActionOn(observer, ({click})=>click()))
    toPerformAnAction: StepOf<TestPlans>

    @observation(observer, Is(undefined))
    toConfirmVisual: StepOf<TestPlans>
}