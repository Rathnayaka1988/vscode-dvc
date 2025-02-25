import { TopLevelSpec } from 'vega-lite'

const data = {
  $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
  data: {
    values: '<DVC_METRIC_DATA>'
  },
  title: '<DVC_METRIC_TITLE>',
  mark: {
    type: 'line'
  },
  encoding: {
    x: {
      field: '<DVC_METRIC_X>',
      type: 'quantitative',
      title: '<DVC_METRIC_X_LABEL>'
    },
    y: {
      field: '<DVC_METRIC_Y>',
      type: 'quantitative',
      title: '<DVC_METRIC_Y_LABEL>',
      scale: {
        zero: false
      }
    },
    color: {
      field: 'rev',
      type: 'nominal'
    }
  },
  transform: [
    {
      loess: '<DVC_METRIC_Y>',
      on: '<DVC_METRIC_X>',
      groupby: ['rev'],
      bandwidth: 0.3
    }
  ]
} as TopLevelSpec

export default data
