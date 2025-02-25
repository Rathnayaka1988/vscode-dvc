import {
  LATEST_TESTED_CLI_VERSION,
  MAX_CLI_VERSION,
  MIN_CLI_VERSION
} from './constants'
import { CliCompatible, isVersionCompatible } from './version'
import { IExtension } from '../../interfaces'
import { Toast } from '../../vscode/toast'
import { Response } from '../../vscode/response'
import {
  ConfigKey,
  getConfigValue,
  setUserConfigValue
} from '../../vscode/config'
import {
  getPythonBinPath,
  isPythonExtensionInstalled,
  selectPythonInterpreter
} from '../../extensions/python'

const getToastOptions = (isPythonExtensionInstalled: boolean): Response[] => {
  return isPythonExtensionInstalled
    ? [Response.SETUP_WORKSPACE, Response.SELECT_INTERPRETER, Response.NEVER]
    : [Response.SETUP_WORKSPACE, Response.NEVER]
}

export const warnUnableToVerifyVersion = () =>
  Toast.warnWithOptions(
    'The extension cannot initialize as we were unable to verify the DVC CLI version.'
  )

export const warnVersionIncompatible = (
  version: string,
  update: 'CLI' | 'extension'
): void => {
  Toast.warnWithOptions(
    `The extension cannot initialize because you are using version ${version} of the DVC CLI. The expected version is ${MIN_CLI_VERSION} <= DVC < ${MAX_CLI_VERSION}. Please upgrade to the most recent version of the ${update} and reload this window.`
  )
}

export const warnAheadOfLatestTested = (): void => {
  Toast.warnWithOptions(
    `The located DVC CLI is at least a minor version ahead of the latest version the extension was tested with (${LATEST_TESTED_CLI_VERSION}). This could lead to unexpected behaviour. Please upgrade to the most recent version of the extension and reload this window.`
  )
}

const warnUserCLIInaccessible = async (
  extension: IExtension,
  isMsPythonInstalled: boolean,
  warningText: string
): Promise<void> => {
  if (getConfigValue<boolean>(ConfigKey.DO_NOT_SHOW_CLI_UNAVAILABLE)) {
    return
  }

  const response = await Toast.warnWithOptions(
    warningText,
    ...getToastOptions(isMsPythonInstalled)
  )

  switch (response) {
    case Response.SELECT_INTERPRETER:
      return selectPythonInterpreter()
    case Response.SETUP_WORKSPACE:
      return extension.setupWorkspace()
    case Response.NEVER:
      return setUserConfigValue(ConfigKey.DO_NOT_SHOW_CLI_UNAVAILABLE, true)
  }
}

const warnUserCLIInaccessibleAnywhere = async (
  extension: IExtension,
  globalDvcVersion: string | undefined
): Promise<void> => {
  const binPath = await getPythonBinPath()

  return warnUserCLIInaccessible(
    extension,
    true,
    `The extension is unable to initialize. The CLI was not located using the interpreter provided by the Python extension. ${
      globalDvcVersion ? globalDvcVersion + ' is' : 'The CLI is also not'
    } installed globally. For auto Python environment activation, ensure the correct interpreter is set. Active Python interpreter: ${binPath}.`
  )
}

const warnUser = (
  extension: IExtension,
  cliCompatible: CliCompatible,
  version: string | undefined
): void => {
  if (!extension.hasRoots()) {
    return
  }
  switch (cliCompatible) {
    case CliCompatible.NO_BEHIND_MIN_VERSION:
      return warnVersionIncompatible(version as string, 'CLI')
    case CliCompatible.NO_CANNOT_VERIFY:
      warnUnableToVerifyVersion()
      return
    case CliCompatible.NO_MAJOR_VERSION_AHEAD:
      return warnVersionIncompatible(version as string, 'extension')
    case CliCompatible.NO_NOT_FOUND:
      warnUserCLIInaccessible(
        extension,
        isPythonExtensionInstalled(),
        'An error was thrown when trying to access the CLI.'
      )
      return
    case CliCompatible.YES_MINOR_VERSION_AHEAD_OF_TESTED:
      return warnAheadOfLatestTested()
  }
}

type CanRunCli = {
  isAvailable: boolean
  isCompatible: boolean | undefined
}

const isCliCompatible = (cliCompatible: CliCompatible): boolean | undefined => {
  if (cliCompatible === CliCompatible.NO_NOT_FOUND) {
    return
  }

  return [
    CliCompatible.YES,
    CliCompatible.YES_MINOR_VERSION_AHEAD_OF_TESTED
  ].includes(cliCompatible)
}

const getVersionDetails = async (
  extension: IExtension,
  cwd: string,
  tryGlobalCli?: true
): Promise<
  CanRunCli & {
    cliCompatible: CliCompatible
    version: string | undefined
  }
> => {
  const version = await extension.getCliVersion(cwd, tryGlobalCli)
  const cliCompatible = isVersionCompatible(version)
  const isCompatible = isCliCompatible(cliCompatible)
  return { cliCompatible, isAvailable: !!isCompatible, isCompatible, version }
}

const processVersionDetails = (
  extension: IExtension,
  cliCompatible: CliCompatible,
  version: string | undefined,
  isAvailable: boolean,
  isCompatible: boolean | undefined
): CanRunCli => {
  warnUser(extension, cliCompatible, version)
  return {
    isAvailable,
    isCompatible
  }
}

const tryGlobalFallbackVersion = async (
  extension: IExtension,
  cwd: string
): Promise<CanRunCli> => {
  const tryGlobal = await getVersionDetails(extension, cwd, true)
  const { cliCompatible, isAvailable, isCompatible, version } = tryGlobal

  if (extension.hasRoots() && !isCompatible) {
    warnUserCLIInaccessibleAnywhere(extension, version)
  }
  if (
    extension.hasRoots() &&
    cliCompatible === CliCompatible.YES_MINOR_VERSION_AHEAD_OF_TESTED
  ) {
    warnAheadOfLatestTested()
  }

  if (isCompatible) {
    extension.unsetPythonBinPath()
  }

  return { isAvailable, isCompatible }
}

const extensionCanAutoRunCli = async (
  extension: IExtension,
  cwd: string
): Promise<CanRunCli> => {
  const {
    cliCompatible: pythonCliCompatible,
    isAvailable: pythonVersionIsAvailable,
    isCompatible: pythonVersionIsCompatible,
    version: pythonVersion
  } = await getVersionDetails(extension, cwd)

  if (pythonCliCompatible === CliCompatible.NO_NOT_FOUND) {
    return tryGlobalFallbackVersion(extension, cwd)
  }
  return processVersionDetails(
    extension,
    pythonCliCompatible,
    pythonVersion,
    pythonVersionIsAvailable,
    pythonVersionIsCompatible
  )
}

export const extensionCanRunCli = async (
  extension: IExtension,
  cwd: string
): Promise<CanRunCli> => {
  if (await extension.isPythonExtensionUsed()) {
    return extensionCanAutoRunCli(extension, cwd)
  }

  const { cliCompatible, isAvailable, isCompatible, version } =
    await getVersionDetails(extension, cwd)

  return processVersionDetails(
    extension,
    cliCompatible,
    version,
    isAvailable,
    isCompatible
  )
}
