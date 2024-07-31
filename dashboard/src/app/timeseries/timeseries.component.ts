import { Component, Input } from '@angular/core';
import { NgxEchartsDirective, provideEcharts } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { LogInterface } from '../map/map.component';
import { catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-timeseries',
  standalone: true,
  imports: [NgxEchartsDirective],
  templateUrl: './timeseries.component.html',
  styleUrl: './timeseries.component.scss',
  providers: [provideEcharts()],
})
export class TimeseriesComponent {
  @Input() matrix?: string;
  @Input() block?: number;
  public chartOption!: EChartsOption;
  public mergeOptions!: EChartsOption;
  private data: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  private logs?: LogInterface[];

  constructor(private _http: HttpClient) {}

  ngOnInit() {
    this.initializeChart();
    this._http
      .get<LogInterface[]>(`http://192.168.0.101:8000/log_entries/`, {
        params: {
          limit: 100000,
        },
      })
      .subscribe((data) => {
        this.logs = data;
      });
  }

  ngOnChanges() {
    if (this.block !== undefined) {
      this._http
        .get<LogInterface[]>(
          `http://192.168.0.101:8000/census_blocks/${this.block}/log_entries
`
        )
        .pipe(
          catchError(
            this.handleError<LogInterface[]>('census_blocks_log_entries', [])
          )
        )
        .subscribe((data) => {
          console.log(data);
          this.logs = data;
          this.updateChart();
        });
    }
    this.updateChart();
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      // console.error(error); // log to console instead
      // console.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  updateChart() {
    let key: keyof LogInterface;
    let decimal: number;
    let axisLabel: string;
    if (this.matrix !== undefined) {
      // console.log(this.matrix);
      switch (this.matrix) {
        case 'Weight': {
          key = 'weight_grams';
          decimal = 2;
          axisLabel = 'grams';
          break;
        }

        case 'CO2': {
          key = 'co2';
          decimal = 2;
          axisLabel = 'grams';
          break;
        }

        case 'Methane': {
          key = 'methane';
          decimal = 2;
          axisLabel = 'grams';
          break;
        }

        case 'Contribution': {
          decimal = 0;
          axisLabel = 'times';
          break;
        }
      }
      this.data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.logs?.forEach((element) => {
        element.time = new Date(element.time);
        if (Date.now() - element.time.getTime() < 1000 * 60 * 60 * 24 * 365) {
          if (key !== undefined) {
            this.data[element.time.getMonth()] += element[key] as number;
          } else {
            this.data[element.time.getMonth()] += 1;
          }
        }
      });
      this.data = this.data.concat(this.data.slice(0, 7)).slice(7, 19);
      // console.log(this.data);
      this.mergeOptions = {
        title: {
          text: `${this.matrix} over the past year`,
        },
        yAxis: {
          axisLabel: { formatter: `{value} ${axisLabel!}` },
        },
        series: {
          name: this.matrix,
          data: this.data,
          markPoint: {
            label: {
              formatter: (param) => {
                return `${(param.value as number).toFixed(decimal)}`;
              },
            },
          },
        },
        tooltip: {
          valueFormatter: (value) => {
            return `${(value as number).toFixed(decimal)} ${axisLabel}`;
          },
        },
      };
    }
  }

  initializeChart() {
    this.chartOption = {
      title: {
        text: 'Data over past year',
        subtext: 'Fake Data',
      },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value) => (value as number).toFixed(2),
      },
      xAxis: {
        data: [
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
        ],
        type: 'category',
        silent: false,
        splitLine: {
          show: false,
        },
      },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'bar',
          data: this.data,
          markPoint: {
            data: [
              { type: 'max', name: 'Max' },
              { type: 'min', name: 'Min' },
            ],
          },
          markLine: {
            data: [{ type: 'average', name: 'Avg' }],
          },
        },
      ],
      animationEasing: 'elasticOut',
      animationDelayUpdate: (idx) => idx * 5,
    };
  }
}
