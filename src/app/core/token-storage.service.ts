import {Injectable} from '@angular/core';import {JwtPayload} from '../models/api.models';
@Injectable({providedIn:'root'}) export class TokenStorageService{
 private readonly key='smartrecruit.access_token'; get token(){return sessionStorage.getItem(this.key)}
 set(token:string){sessionStorage.setItem(this.key,token)} clear(){sessionStorage.removeItem(this.key)}
 payload():JwtPayload|null{try{const t=this.token;if(!t)return null;let part=t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');part+= '='.repeat((4-part.length%4)%4);return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(part),c=>c.charCodeAt(0))))}catch{return null}}
 get expired(){const e=this.payload()?.exp;return !e||Date.now()>=e*1000} get roles(){return this.payload()?.roles??[]}
}
