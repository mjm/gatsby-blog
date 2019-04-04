import CMS from "netlify-cms";

import BlogPostPreview from "./preview-templates/BlogPostPreview";
import MicroblogPostPreview from "./preview-templates/MicroblogPostPreview";
import StaticPagePreview from "./preview-templates/StaticPagePreview";

CMS.registerPreviewTemplate("about", StaticPagePreview);
CMS.registerPreviewTemplate("blog", BlogPostPreview);
CMS.registerPreviewTemplate("micro", MicroblogPostPreview);
