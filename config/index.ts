import {commonvars as devVars} from './dev'
import {commonvars as prodVars} from './prod'
import {commonvars as testVars} from './test'

export const getEnvContext = (branch: string) => {
    switch(branch) {
        case 'develop':
            return devVars
        case 'test':
            return testVars
        case 'main':
            return prodVars
        default:
            return devVars
    }
}