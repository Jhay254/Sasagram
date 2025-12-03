import type { Metadata } from "next";

export const siteConfig = {
    name: "Sasagram",
    description: "Transform your digital memories into compelling, AI-generated biographies. Share your life story with the world.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://sasagram.app",
    ogImage: "/og-image.jpg",
    links: {
        twitter: "https://twitter.com/sasagramapp",
        github: "https://github.com/yourusername/sasagram",
    },
};

export function generateMetadata({
    title,
    description,
    image,
    noIndex = false,
}: {
    title?: string;
    description?: string;
    image?: string;
    noIndex?: boolean;
}): Metadata {
    const metaTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name;
    const metaDescription = description || siteConfig.description;
    const metaImage = image || siteConfig.ogImage;

    return {
        title: metaTitle,
        description: metaDescription,
        keywords: [
            "biography",
            "digital memories",
            "AI writing",
            "life story",
            "memoir",
            "autobiography",
            "content creation",
            "sasagram",
        ],
        authors: [{ name: "Sasagram Team" }],
        creator: "Sasagram",
        openGraph: {
            type: "website",
            locale: "en_US",
            url: siteConfig.url,
            title: metaTitle,
            description: metaDescription,
            siteName: siteConfig.name,
            images: [
                {
                    url: metaImage,
                    width: 1200,
                    height: 630,
                    alt: siteConfig.name,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: metaTitle,
            description: metaDescription,
            images: [metaImage],
            creator: "@sasagramapp",
        },
        robots: {
            index: !noIndex,
            follow: !noIndex,
            googleBot: {
                index: !noIndex,
                follow: !noIndex,
                "max-video-preview": -1,
                "max-image-preview": "large",
                "max-snippet": -1,
            },
        },
        ...(noIndex && {
            metadataBase: new URL(siteConfig.url),
        }),
    };
}
