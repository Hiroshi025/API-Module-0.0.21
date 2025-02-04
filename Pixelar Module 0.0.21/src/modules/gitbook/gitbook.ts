import fetch from "node-fetch";

import { logWithLabel } from "@lib/utils/log";

import { ConfigGit } from "./config";
import { Files, Page } from "./types/types";

/* The GitBook class in TypeScript fetches information about the contents of a space in GitBook using
the SpaceDocs method. */
export class GitBook {
  constructor() {}
  /**
   * Gets information about the contents of a space in GitBook.
   *
   * @param spaceId - The ID of the space to query.
   * @returns An object containing the details of the space, including pages and files, or `null` on error.
   */
  public async SpaceDocs(spaceId: string) {
    const response = await fetch(`${ConfigGit.url}spaces/${spaceId}/content`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ConfigGit.token}`,
      },
    });

    if (!response.ok) {
      logWithLabel(
        "custom",
        [
          `GitBook API Error: ${response.status} ${response.statusText}`,
          `Space ID: ${spaceId}`,
          `Token: ${ConfigGit.token}`,
        ].join("\n"),
        "Gitbook"
      );
      return null;
    }

    const data = await response.json();
    return {
      id: data.id,
      createdAt: data.mergedFrom.createdAt,
      creator: {
        username: data.mergedFrom.createdBy.displayName,
        icon: data.mergedFrom.createdBy.photoURL,
      },
      header: {
        title: data.pages[0].title,
        description: data.pages[0].description,
        url: `${process.env.DOCS}/${data.pages[0].path}`,
      },
      pages: data.pages.map((page: Page) => {
        return {
          title: page.title,
          description: page.description,
          path: page.path,
          createdAt: page.createdAt,
          url: `${process.env.DOCS}/${page.path}`,
        };
      }),
      files: data.files.map((file: Files) => {
        return {
          name: file.name,
          url: file.url,
          type: file.contentType,
          size: file.size / 1000 + "KB",
        };
      }),
    };
  }
}
