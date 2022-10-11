import { beginsWith, New, Story, Tab } from "../..";
@beginsWith(Tab('google', New))
class TestStory extends Story{

}

@beginsWith(TestStory)
class DerivedStory extends Story{
    
}

describe('beginsWith', ()=>{
//'metadata:endsThen'
})