// @flow
import type { Price } from '~/compare/helpers/charts';
import React from 'react';
import Chart from 'chart.js';
import { connect } from 'react-redux';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import injectSheet from 'react-jss';
import { generateLineChartData } from '~/compare/helpers/charts';
import Loading from './ComparisonChartLoading';

Chart.defaults.global.defaultFontColor = '#767D8B';
Chart.defaults.global.defaultFontFamily = 'Montserrat';
Chart.defaults.global.defaultFontSize = 12;
Chart.defaults.global.defaultFontStyle = 'normal';

type Props = {
  prices: Price[],
  classes: Object,
  colors: string[],
  tickers: string[],
  isFetching: boolean,
  icos: Object[]
};

class ComparisonChart extends React.Component {
  props: Props;
  canvas: HTMLCanvasElement;
  chart: Object;

  renderChart (ctx) {
    if (!ctx) {
      return;
    }
    const { prices, colors, icos, tickers } = this.props;
    const sorted = prices.slice().sort((a, b) =>
      tickers.indexOf(a.ticker) - tickers.indexOf(b.ticker)
    );
     const data = generateLineChartData(sorted, colors, icos);
     const options = {
       showLines: true,
       spanGaps: false,
       responsive: true,
       legend: {
         display: false
       },
       scales: {
         yAxes: [{
           ticks: {
             callback: (value) => `${value < 0 ? '-' : '+'}${value*100}%`
           },
           scaleLabel: {
             display: true,
             labelString: 'ROI since ICO',
             fontColor: '#FFFFFF'
           },
           gridLines: {
             color: '#767D8B',
             backgroundColor: '#767D8B',
             drawBorder: false,
             borderDash: [1, 4]
           }
         }],
         xAxes: [{
           scaleLabel: {
             display: true,
             labelString: 'Date',
             fontColor: '#FFFFFF'
           },
           gridLines: {
             display: false
           }
         }]
       }
     };
     this.chart = new Chart(ctx, {
       type: 'line',
       data,
       options
     });
   }

   render() {
     const { classes: c, isFetching } = this.props;

     if (isFetching) {
       return <div className={c.loadingWrapper}><Loading /></div>;
     }

     return (
       <div className={c.container}>
         <canvas
           className={c.canvas}
           ref={this.renderChart.bind(this)}
         />
       </div>
     );
   }
 }

/* =============================================================================
 =  GraphQL: Get Data
============================================================================= */
const QUERY = gql`
query getprices($tickers: [String!]) {
  prices(tickers: $tickers) {
    ticker
    price_usd
  }
  icos {
    ticker
    name
    implied_token_price
  }
}
`;
const mapDataToProps = result => ({
  prices: result.data.prices,
  icos: result.data.icos,
  isFetching: result.data.loading
});
const withData = graphql(QUERY, {
  options: ({ tickers }) => ({ variables: { tickers }}),
  props: mapDataToProps
})(ComparisonChart);


/* =============================================================================
 =    Redux
============================================================================= */
const mapStateToProps = state => ({
  tickers: state.compare.tickers
});
const container = connect(mapStateToProps)(withData);

const styles = {
  container: {
    margin: '40px 10px 0 0px',
    flexGrow: 2,
    display: 'flex',
    alignItems: 'center'
  },
  canvas: {
    maxWidth: '100%',
    height: '100%'
  },
  loadingWrapper: {
    width: '90%',
    flexGrow: '2',
    margin: '0 auto',
    paddingTop: '50px'
  }
};

export default injectSheet(styles)(container);
