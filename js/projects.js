(function () {
  const script = document.currentScript;
  const user = script && script.dataset.githubUser;
  const list = document.getElementById("pages-list");
  const status = document.getElementById("pages-status");

  if (!user || !list || !status) {
    return;
  }

  function pagesUrl(repo) {
    const owner = repo.owner.login;
    if (repo.name === owner + ".github.io") {
      return "https://" + owner + ".github.io/";
    }
    return "https://" + owner + ".github.io/" + repo.name + "/";
  }

  function repoUrl(repo) {
    if (repo.has_pages && repo.name !== user + ".github.io") {
      return pagesUrl(repo);
    }
    return repo.html_url;
  }

  function setStatus(message, isError) {
    status.textContent = message;
    status.hidden = !message;
    if (isError) {
      status.setAttribute("data-error", "");
    } else {
      status.removeAttribute("data-error");
    }
  }

  function render(repos) {
    const userSite = user + ".github.io";
    const projects = repos
      .filter(function (repo) {
        return !repo.fork && repo.name !== userSite;
      })
      .sort(function (a, b) {
        return new Date(b.pushed_at) - new Date(a.pushed_at);
      });

    if (projects.length === 0) {
      setStatus("No public projects yet.");
      return;
    }

    projects.forEach(function (repo) {
      const article = document.createElement("article");
      article.className = "post on-list";

      const title = document.createElement("h2");
      title.className = "post-title";
      const link = document.createElement("a");
      link.href = repoUrl(repo);
      link.textContent = repo.name;
      title.appendChild(link);
      article.appendChild(title);

      const metaParts = [];
      if (repo.language) {
        metaParts.push(repo.language);
      }
      if (repo.archived) {
        metaParts.push("archived");
      }
      if (metaParts.length) {
        const meta = document.createElement("div");
        meta.className = "post-meta";
        meta.textContent = metaParts.join(" · ");
        article.appendChild(meta);
      }

      if (repo.description) {
        const content = document.createElement("div");
        content.className = "post-content";
        const desc = document.createElement("p");
        desc.textContent = repo.description;
        content.appendChild(desc);
        article.appendChild(content);
      }

      list.appendChild(article);
    });

    list.hidden = false;
    setStatus("");
  }

  async function fetchAllRepos() {
    const repos = [];
    let page = 1;

    while (true) {
      const res = await fetch(
        "https://api.github.com/users/" +
          encodeURIComponent(user) +
          "/repos?per_page=100&page=" +
          page +
          "&sort=pushed&direction=desc"
      );

      if (!res.ok) {
        throw new Error("GitHub API returned " + res.status);
      }

      const batch = await res.json();
      if (!Array.isArray(batch)) {
        throw new Error("Unexpected GitHub API response");
      }

      repos.push.apply(repos, batch);
      if (batch.length < 100) {
        break;
      }
      page += 1;
    }

    return repos;
  }

  fetchAllRepos().then(render).catch(function () {
    setStatus("Could not load projects from GitHub.", true);
  });
})();
