import { constructor } from "tsyringe/dist/typings/types";
import { Plans } from "./plans";

function constructPlans<T extends Plans>(plans: constructor<T>){
    const metadata = Reflect.getMetadata(plans, 'plan-structure')
}