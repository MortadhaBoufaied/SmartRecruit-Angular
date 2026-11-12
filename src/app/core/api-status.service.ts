import {Injectable,signal} from '@angular/core';
@Injectable({providedIn:'root'})export class ApiStatusService{message=signal('');kind=signal<'success'|'error'>('success');private timer?:ReturnType<typeof setTimeout>;show(message:string,kind:'success'|'error'='success'){this.message.set(message);this.kind.set(kind);clearTimeout(this.timer);this.timer=setTimeout(()=>this.message.set(''),4500)}}
