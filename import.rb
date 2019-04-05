require 'json'
require 'yaml'
require 'fileutils'

posts = ARGF.readlines.map {|line| JSON.parse(line)}

posts.each do |post|
  blogId = post.fetch("blogId").fetch("S")
  path = post.fetch("path").fetch("S")
  next unless blogId == "mattmoriarity.com"
  next unless path.start_with?("posts/")

  type = "micro"
  content = post.fetch("content").fetch("S")
  content.gsub!(%r{https://mattmoriarity.com/wp-content}, '/wp-content')
  frontmatter = {
    "templateKey" => "microblog-post",
    "date" => post.fetch("published").fetch("S")
  }
  if post["name"]
    type = "blog"
    frontmatter["templateKey"] = "blog-post"
    frontmatter['title'] = post.fetch("name").fetch("S")
  end
  if post["photo"]
    photos = post.fetch("photo").fetch("L")
    frontmatter['photos'] = photos.map {|photo| photo.fetch("S").sub(%r{^https://mattmoriarity.com}, '') }
  end
  if post["syndication"]
    urls = post.fetch("syndication").fetch("L")
    frontmatter['syndication'] = urls.map {|url| url.fetch("S") }
  end

  path = path.sub(%r{^posts/}, "src/pages/#{type}/")
  path += ".md"

  FileUtils.mkdir_p File.dirname(path)
  File.open(path, "w") do |f|
    f.puts YAML.dump(frontmatter)
    f.puts "---\n\n"
    f.puts content
    f.puts
  end
end