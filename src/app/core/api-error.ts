import {HttpErrorResponse} from '@angular/common/http';
export function apiError(error:unknown,fallback='The request could not be completed.'):string{
 const e=error as HttpErrorResponse; const body=e?.error;
 if(typeof body==='string'&&body.trim())return body;
 return body?.detail||body?.message||body?.error||(!navigator.onLine?'No network connection.':e?.status===0?'The API Gateway is unavailable.':e?.status===403?'You do not have permission for this action.':e?.status===404?'The requested record no longer exists.':fallback);
}
