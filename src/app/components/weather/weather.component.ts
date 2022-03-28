import { Component, OnInit } from '@angular/core';
import { WeatherService } from 'src/app/Services/weather.service';
import { DatePipe } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-weather',
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.css']
})
export class WeatherComponent implements OnInit {
  location!:string;
  weatherLocation!:string;
  weather!:any;
  dailyWeather!:any;
  date!:Date;
  dayOfWeek!:string;
  month!:string;
  day!:number;
  year!:number;
  time!:string;
  flag:boolean=false;
  days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  months = ["January", "Ferbuary", "March", "April", "May", "June", "July", "August", "September","October","November","December"]
  dailyForecastWeekDays:string[]=[];
  weatherData!:any;
  timezone!:string;
  chartForDailyForecast:any=[];
  chartForHourlyForecast:any=[];
  DatesForDailyForecast:any=[];
  DatesForHourlyForecast:any=[];
  dailyTemp:number[]=[];
  hourlyTemp:number[]=[];
  hourlyTime:string[]=[];
  hourlyMeridian:string[]=[];
  hourlyForecastIcon:string[]=[];
  dailyForecastIcon:string[]=[];
  errorMessage!:string;
  errorflag!:boolean;

  ngOnInit(): void {
    Chart.register(...registerables);
  }

  constructor(private service:WeatherService, private datePipe:DatePipe, private spinner: NgxSpinnerService) { }

   data() {
    this.date = new Date();
    this.dayOfWeek = this.days[this.date.getDay()];
    this.month = this.months[this.date.getMonth()];
    this.day = this.date.getDate();
    this.year = this.date.getFullYear();
    this.time = this.datePipe.transform(this.date,'hh:mm a')||"";
    this.dailyForecastWeekDays.push(this.dayOfWeek.substring(0,3));
    let day = this.date.getDay();
    for(let i=1;i<=7;i++) {
      if(day==6) {
        day=0;
      } else {
        day+=1;
      }
      this.dailyForecastWeekDays.push(this.days[day].substring(0,3));
    }
  }

  sendData(event:any) {
    console.log(event.target.value);
  }

  onSubmit() {
    this.getWeather();
  }

  getWeather() {
    this.spinner.show();
    this.service.getWeather(this.location).subscribe(data=> {
      this.errorflag=false;
      this.weatherLocation=this.location;
      this.data();
      this.weather=data;
      this.weatherData=this.weather.weather;
      this.getWeatherForSevenDays(data.coord.lat,data.coord.lon);
      if(this.weather) {
        this.flag=true;
      }
    },(error:string)=> {
      if(error=='404') {
        this.errorMessage="The given input is INCORRECT, Please Check the input and try again!"
      } else {
        this.errorMessage="We're Sorry for the Incovenience, the server is currently not reachable, We will solve the problen as soon as possible, Please Come Back later!"
      }
      this.flag=false;
      this.errorflag=true;
      this.spinner.hide();
    });
  }

  getWeatherForSevenDays(latitude:number,longitude:number) {
    this.service.getWeatherForSevenDays(this.location,latitude,longitude).subscribe(data=> {
      this.dailyWeather=data;
      this.timezone=this.dailyWeather.timezone;
      if(this.chartForDailyForecast!="") {
        this.chartForDailyForecast.destroy();
      }
      if(this.chartForHourlyForecast!="") {
        this.chartForHourlyForecast.destroy();
      }
      this.getChartAndForecastData();
      this.spinner.hide();
    })
  }

  getChartAndForecastData() {
    let tempMax = this.dailyWeather['daily'].map((data: { temp: { max: number; }; })=> data.temp.max);
    let tempMin = this.dailyWeather['daily'].map((data: { temp: { min: number; }; })=> data.temp.min);
    let hourlyTemp = this.dailyWeather['hourly'].map(((data: { temp: number; }) => data.temp));
    let dailyDates = this.dailyWeather['daily'].map(((data: { dt: number; }) => data.dt));
    let hourlyTimeForForecast = this.dailyWeather['hourly'].map(((data: { dt: number; }) => data.dt));
    let hourlyTemperature:number[]=[];
    let hourlyTime:string[]=[];
    let hourlyMeridian:string[]=[];
    let DatasetForHourlyForecast:string[]=[];
    let dayTemp = this.dailyWeather['daily'].map((data: { temp: { day: number; }; })=> data.temp.day);
    let hourIcon:string[]=[];
    let dailyIcon:string[]=[];
    this.DatesForDailyForecast=[];
    dailyDates.forEach((res: number) => {
      let date = new Date(res*1000);
      this.DatesForDailyForecast.push(date.toLocaleTimeString('en',{year: 'numeric', month: 'short', day: 'numeric'}).substring(0,7).split(',').join(""));
    });
    hourlyTimeForForecast.forEach((res:number) => {
      let date = new Date(res*1000);
      this.DatesForHourlyForecast.push(date.toLocaleTimeString('en',{year: 'numeric', month: 'short', day: 'numeric'}).substring(0,25).split(',').join(""));
    });
    for(let i=0;i<=7;i++) {
      hourlyTemperature.push(hourlyTemp[i]);
      DatasetForHourlyForecast.push(this.DatesForHourlyForecast[i].substring(12,16)+this.DatesForHourlyForecast[i].substring(19));
      hourlyTime.push(DatasetForHourlyForecast[i].substring(0,5).split(" ").join(""));
      hourlyMeridian.push(DatasetForHourlyForecast[i].substring(5).split(" ").join(""));
    }
    for(let i=0;i<=7;i++) {
      dailyIcon.push(this.dailyWeather['daily'][i]['weather'][0]['icon']);
      hourIcon.push(this.dailyWeather['hourly'][i]['weather'][0]['icon']);
    }
    this.dailyTemp=dayTemp;
    this.hourlyTemp=hourlyTemperature;
    this.hourlyTime=hourlyTime;
    this.hourlyMeridian=hourlyMeridian;
    this.dailyForecastIcon=dailyIcon;
    this.hourlyForecastIcon=hourIcon;
    //Calling Chart
    this.getDailyChart(tempMin,tempMax);
    this.getHourlyChart();
  }

  getHourlyChart() {
    this.chartForHourlyForecast = new Chart("hourlyChart", {
      type: 'line',
      data: {
        labels: this.hourlyTime,
        datasets: [
          {
            label: 'Temperature',
            data: this.hourlyTemp,
            backgroundColor: 'transperent',
            borderColor: 'blue',
            borderWidth: 4
          }
        ]
      },
      options: {
        elements: {
          line: {
            tension: 0.2
          }
        },
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });

  }

  getDailyChart(tempMin:number[],tempMax:number[]) {
    this.chartForDailyForecast = new Chart("dailyChart", {
      type: 'line',
      data: {
        labels: this.DatesForDailyForecast,
        datasets: [
          {
            label: 'Minimum temperature',
            data: tempMin,
            backgroundColor: 'transperent',
            borderColor: 'blue',
            borderWidth: 4
          },
          {
            label: 'Maximum Temperature',
            data: tempMax,
            backgroundColor: 'transparent',
            borderColor: 'red',
            borderWidth: 4
          }
        ]
      },
      options: {
        elements: {
          line: {
            tension:0.2
          }
        },
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });
  }
}
