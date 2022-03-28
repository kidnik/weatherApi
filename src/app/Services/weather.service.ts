import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  url:string='https://api.openweathermap.org/data/2.5/weather?q=';
  urlForDailyForecast:string = 'https://api.openweathermap.org/data/2.5/onecall?'
  ApiKey:string='db6c82472832e9b00b6054a5164dbba0';
  constructor(private http:HttpClient) { }

  getWeather(city:string):Observable<any> {
    return this.http.get<Object[]>(`${this.url}${city}&appid=${this.ApiKey}&units=metric`).pipe(catchError(this.handleError));
  }

  getWeatherForSevenDays(city:string,latitude:number,longitude:number):Observable<any> {
    return this.http.get<any>(`${this.urlForDailyForecast}lat=${latitude}&lon=${longitude}&exclude=minutely,alerts&appid=${this.ApiKey}&units=metric`);
  }

  handleError(error:HttpErrorResponse) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // client-side error
      errorMessage = `${error.status}`;
    } else {
      // server-side error
      errorMessage = `${error.status}`;
    }
    return throwError(() => {
        return errorMessage;
    });
  }
}
