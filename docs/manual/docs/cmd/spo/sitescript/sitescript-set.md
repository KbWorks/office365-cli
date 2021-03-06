# spo sitescript set

Updates existing site script

## Usage

```sh
spo sitescript set [options]
```

## Options

Option|Description
------|-----------
`--help`|output usage information
`-i, --id <id>`|Site script ID
`-t, --title [title]`|Site script title
`-d, --description [description]`|Site script description
`-v, --version [version]`|Site script version
`-c, --content [content]`|JSON string containing the site script
`-o, --output [output]`|Output type. `json|text`. Default `text`
`--verbose`|Runs command with verbose logging
`--debug`|Runs command with debug logging

!!! important
    Before using this command, log in to a SharePoint Online site, using the [spo login](../login.md) command.

## Remarks

To update a site script, you have to first log in to a SharePoint site using the [spo login](../login.md) command, eg. `spo login https://contoso.sharepoint.com`.

If the specified `id` doesn't refer to an existing site script, you will get a `File not found` error.

## Examples

Update title of the existing site script with ID _2c1ba4c4-cd9b-4417-832f-92a34bc34b2a_

```sh
spo sitescript set --id 2c1ba4c4-cd9b-4417-832f-92a34bc34b2a --title "Contoso"
```

## More information

- SharePoint site design and site script overview: [https://docs.microsoft.com/en-us/sharepoint/dev/declarative-customization/site-design-overview](https://docs.microsoft.com/en-us/sharepoint/dev/declarative-customization/site-design-overview)