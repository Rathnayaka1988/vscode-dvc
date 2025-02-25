import { TopLevelSpec } from 'vega-lite'

const data = {
  $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
  data: {
    values: '<DVC_METRIC_DATA>'
  },
  title: '<DVC_METRIC_TITLE>',
  width: 300,
  height: 300,
  layer: [
    {
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
      layer: [
        {
          mark: 'point'
        },
        {
          selection: {
            label: {
              type: 'single',
              nearest: true,
              on: 'mouseover',
              encodings: ['x'],
              empty: 'none',
              clear: 'mouseout'
            }
          },
          mark: 'point',
          encoding: {
            opacity: {
              condition: {
                selection: 'label',
                value: 1
              },
              value: 0
            }
          }
        }
      ]
    },
    {
      transform: [
        {
          filter: {
            selection: 'label'
          }
        }
      ],
      layer: [
        {
          encoding: {
            text: {
              type: 'quantitative',
              field: '<DVC_METRIC_Y>'
            },
            x: {
              field: '<DVC_METRIC_X>',
              type: 'quantitative'
            },
            y: {
              field: '<DVC_METRIC_Y>',
              type: 'quantitative'
            }
          },
          layer: [
            {
              mark: {
                type: 'text',
                align: 'left',
                dx: 5,
                dy: -5
              },
              encoding: {
                color: {
                  type: 'nominal',
                  field: 'rev'
                }
              }
            }
          ]
        }
      ]
    }
  ]
} as TopLevelSpec

export default data
