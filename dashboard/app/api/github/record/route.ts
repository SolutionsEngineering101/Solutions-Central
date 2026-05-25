import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile } from "@/lib/github";
import { slugify } from "@/lib/utils";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, title, tags, domain, content, author } = await req.json();
  const date = new Date().toISOString().split("T")[0];
  const slug = slugify(title);

  if (type === "playbook") {
    const path = `playbook/entries/${date}-${slug}.md`;
    const fileContent = `---
title: "${title}"
date: ${date}
author: "${author}"
tags: [${tags}]
related_solutions: []
related_documents: []
---

# ${title}

## Context
${content}

## What We Learned


## Steps / How-To


## Outcome


## References
`;
    await writeFile(path, fileContent, `playbook: add entry "${title}"`);
    return NextResponse.json({ ok: true, path });
  }

  if (type === "blueprint") {
    const path = `pre-built-solutions/blueprints/${date}-${slug}.md`;
    const fileContent = `---
title: "${title}"
date: ${date}
author: "${author}"
domain: "${domain}"
client_type: ""
tags: [${tags}]
---

# ${title}

## Use Case
${content}

## Solution Overview


## Components


## Implementation Steps


## Suggested Attachments


## Caveats / Constraints


## Past Usage
`;
    await writeFile(path, fileContent, `blueprint: add "${title}"`);
    return NextResponse.json({ ok: true, path });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
