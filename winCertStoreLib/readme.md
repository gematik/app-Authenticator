# WinCertStoreLib

WinCertStoreLib is a .NET library that retrieves certificates from specified Windows certificate stores and
returns them in PEM format. This library is designed to be used with Node.js applications through the (electron)-edge.js
library.

## Features

- Retrieve certificates from various Windows certificate stores.
- Convert certificates to PEM format. Returned as a string.
- Asynchronous method implementation for efficient processing.

## Requirements

- .NET Framework 4.8 (https://dotnet.microsoft.com/en-us/download/dotnet-framework/net48)
- (We have encountered trouble with .NET > v.4.8 We recommend the above mentioned version.)
- edge.js for integration with Node.js / electron-edge-js for electron projects

## Troubleshooting

- Be aware, that different .NET versions could be installed on your system. Ensuring the correct version can be done via
`dotnet --info`
- Check your environment variables, that the .NET version with an SDK is chosen before another version without an SDK.

## Build

- Open a command prompt and navigate to the project directory.
- Run the following command to build the project:

```
dotnet build
```

You find the compiled library in the `bin\Debug` or `bin\Release` directory as `dll` File.