import { window } from 'vscode'
import {
  QuickPickItemWithValue,
  quickPickManyValues,
  quickPickOne,
  QuickPickOptionsWithTitle,
  quickPickValue,
  quickPickYesOrNo
} from './quickPick'
import { Response } from './response'
import { Title } from './title'

jest.mock('vscode')

const mockedShowQuickPick = jest.mocked<
  (
    items: QuickPickItemWithValue[],
    options: QuickPickOptionsWithTitle
  ) => Thenable<
    | QuickPickItemWithValue[]
    | QuickPickItemWithValue
    | string
    | undefined
    | unknown
  >
>(window.showQuickPick)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('quickPickValue', () => {
  it('should call window.showQuickPick with the correct arguments', async () => {
    mockedShowQuickPick.mockResolvedValueOnce({ value: 'c' } as unknown)
    const placeHolder = 'these letters are very important'
    const title = 'Choose a letter, any letter...' as Title
    const items = [
      {
        description: 'Definitely A',
        label: 'select a?',
        picked: true,
        value: 'a'
      },
      {
        description: 'Maybe B',
        label: 'do you like b?',
        picked: false,
        value: 'b'
      },
      {
        description: 'Not C',
        label: 'do not pick this?',
        picked: false,
        value: 'c'
      }
    ]
    const probablyC = await quickPickValue(items, { placeHolder, title })
    expect(mockedShowQuickPick).toHaveBeenCalledWith(items, {
      canPickMany: false,
      placeHolder,
      title
    })
    expect(probablyC).toStrictEqual('c')
  })
})

describe('quickPickManyValues', () => {
  it('should call window.showQuickPick with the correct arguments', async () => {
    mockedShowQuickPick.mockResolvedValueOnce([
      { value: 'b' },
      { value: 'c' }
    ] as unknown[])
    const placeHolder = 'these letters are very important'
    const title = 'Choose a letter, any letter...' as Title
    const items = [
      {
        description: 'Definitely A',
        label: 'select a?',
        picked: true,
        value: 'a'
      },
      {
        description: 'Maybe B',
        label: 'do you like b?',
        picked: false,
        value: 'b'
      },
      {
        description: 'Not C',
        label: 'do not pick this?',
        picked: false,
        value: 'c'
      }
    ]
    const result = await quickPickManyValues(items, { placeHolder, title })
    expect(mockedShowQuickPick).toHaveBeenCalledWith(items, {
      canPickMany: true,
      placeHolder,
      title
    })
    expect(result).toStrictEqual(['b', 'c'])
  })
})

describe('quickPickOne', () => {
  it('should call window.showQuickPick with the correct arguments', async () => {
    mockedShowQuickPick.mockResolvedValueOnce(undefined)
    const placeHolder = 'my placeholder'

    const noResponse = await quickPickOne(['a', 'b', 'c'], placeHolder)

    expect(mockedShowQuickPick).toHaveBeenCalledWith(['a', 'b', 'c'], {
      canPickMany: false,
      placeHolder
    })
    expect(noResponse).toStrictEqual(undefined)
  })
})

describe('quickPickYesOrNo', () => {
  it('should call window.showQuickPick with the correct arguments', async () => {
    const title = 'THIS IS THE MOST IMPORTANT DECISION OF YOUR LIFE' as Title
    const placeHolder = 'you have 5 seconds'
    const yesDescription = 'help'
    const yesItem = {
      description: yesDescription,
      label: Response.YES,
      value: true
    }
    const noDescription = 'me'
    mockedShowQuickPick.mockResolvedValueOnce(yesItem)

    const response = await quickPickYesOrNo(yesDescription, noDescription, {
      placeHolder,
      title
    })

    expect(mockedShowQuickPick).toHaveBeenCalledWith(
      [
        yesItem,
        { description: noDescription, label: Response.NO, value: false }
      ],
      {
        canPickMany: false,
        placeHolder,
        title
      }
    )
    expect(response).toStrictEqual(true)
  })
})
