import {HttpInterceptorFn} from '@angular/common/http';import {inject} from '@angular/core';import {finalize} from 'rxjs';import {PendingRequestsService} from './pending-requests.service';
export const loadingInterceptor:HttpInterceptorFn=(req,next)=>{const pending=inject(PendingRequestsService);pending.start();return next(req).pipe(finalize(()=>pending.finish()))};
