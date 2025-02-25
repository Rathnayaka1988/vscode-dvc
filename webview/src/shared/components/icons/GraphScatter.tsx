import * as React from 'react'
import { SVGProps } from 'react'

const SvgGraphScatter = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    {...props}
  >
    <path d="M15 13V14H1.5L1 13.5V0H2V13H15Z" />
    <rect x={5} y={2} width={2} height={2} />
    <rect x={12} y={1} width={2} height={2} />
    <rect x={8} y={5} width={2} height={2} />
    <rect x={5} y={9} width={2} height={2} />
    <rect x={12} y={8} width={2} height={2} />
  </svg>
)

export default SvgGraphScatter
