# mage-album

This is a project for downloading and splitting a YouTube album into individual songs using their timestamps.

## Prerequisites

- [ffmpeg](https://ffmpeg.org/download.html)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)

## Installation

To install the dependencies, run:

Linux:

```bash
sudo apt install ffmpeg yt-dlp
```

Windows:

```powershell
choco install ffmpeg yt-dlp
```

## Usage

To run the project, use the following command:

```bash
bun run index.ts <album-link> <timestamp-file>
```

Replace \<album-link> with the YouTube link of the album and \<timestamp-file> with the path to the file containing timestamps.

The timestamp file should follow an structure like:

```text
Song 1 - 00:00
Song 2 - 02:32
Song 3 - 05:34
```

The list itself usually can be found in the comments of the YouTube video
