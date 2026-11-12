import {inject} from '@angular/core';import {CanActivateFn,Router} from '@angular/router';import {TokenStorageService} from './token-storage.service';
export const authGuard:CanActivateFn=(_,state)=>{const t=inject(TokenStorageService),r=inject(Router);return t.token&&!t.expired||r.createUrlTree(['/login'],{queryParams:{returnUrl:state.url}})};
export const roleGuard=(roles:string[]):CanActivateFn=>()=>{const t=inject(TokenStorageService),r=inject(Router);return roles.some(x=>t.roles.includes(x as any))||r.createUrlTree(['/dashboard'])};
