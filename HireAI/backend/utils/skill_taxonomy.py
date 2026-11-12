"""
HireIQ skill taxonomy and resume skill matcher — MNC IT Company Edition.

Covers:
- IT / Software Engineering / Data / AI / Cloud / DevOps / Security / QA
- Enterprise apps (SAP, Oracle, Salesforce, ServiceNow, Workday, Pega, RPA)
- IT Services (ITIL, ITSM, AMS, ADM, BPO, GCC, CoE)
- Non-IT functions: HR, Marketing, Sales, Finance, Legal, Admin, Operations
- Domain skills: BFSI, Retail, Healthcare, Manufacturing, Telecom, Energy, Education, Public Sector

Design principles:
1. Exact aliases only; no umbrella auto-award (BigQuery ≠ GCP).
2. Umbrella/group labels live in SKILL_MAPPINGS for reporting only.
3. Tune aliases against real JDs and resumes from your MNC.
"""

# ---------------------------------------------------------------------------
# SKILL_ALIASES
# ---------------------------------------------------------------------------
import re

from .skill_aliases_business import SKILL_ALIASES as BUSINESS_SKILLS
from .skill_aliases_domains import SKILL_ALIASES as DOMAIN_SKILLS
from .skill_aliases_technical import SKILL_ALIASES as TECHNICAL_SKILLS

SKILL_ALIASES = {
    **TECHNICAL_SKILLS,
    **BUSINESS_SKILLS,
    **DOMAIN_SKILLS,
}


def _alias_key(value):
    """Same normalisation resume_skills._clean uses, so "already claimed"
    means exactly what the matcher means by it."""
    value = value.casefold().strip()
    value = value.replace("&", " and ")
    value = re.sub(r"[\u2010-\u2015]", "-", value)
    value = re.sub(r"[^a-z0-9+#./-]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def _merge_additive(base, extra):
    """
    Add `extra` skills to `base` WITHOUT changing anything that already works:
      - a skill that already exists gets only the aliases it doesn't have yet
      - an alias already owned by a different skill is skipped (existing wins)
      - a skill whose own name is already owned by another skill is skipped
    Returns a report so the result can be inspected.
    """
    owner = {}
    for canonical, aliases in base.items():
        owner[_alias_key(canonical)] = canonical
        for alias in aliases:
            owner[_alias_key(alias)] = canonical

    report = {
        "new_skills": [],
        "extended_skills": [],
        "skipped_skills": [],    # (skill, already owned by)
        "skipped_aliases": [],   # (alias, wanted for, already owned by)
    }

    for canonical, aliases in extra.items():
        ckey = _alias_key(canonical)
        if ckey in owner and owner[ckey] != canonical:
            report["skipped_skills"].append((canonical, owner[ckey]))
            continue

        is_new = canonical not in base
        merged = list(base.get(canonical, []))
        owner[ckey] = canonical

        for alias in aliases:
            akey = _alias_key(alias)
            if akey in owner and owner[akey] != canonical:
                report["skipped_aliases"].append((alias, canonical, owner[akey]))
                continue
            if alias not in merged:
                merged.append(alias)
            owner[akey] = canonical

        base[canonical] = merged
        report["new_skills" if is_new else "extended_skills"].append(canonical)

    return report


# ---------------------------------------------------------------------------
# DIGITAL MARKETING & SALES SKILLS
# Sits below the data-engineering / technical / business / domain aliases above.
# Additive: merged in by _merge_additive() and never overrides an existing skill
# or alias. Keys use spaces to match the rest of the taxonomy. Near-duplicates were
# folded into skills that already exist (ab testing -> a/b testing, cross selling ->
# cross-selling, crm tools -> crm, hubspot crm -> hubspot, value selling ->
# value-based selling). Aliases marked '# review' may false-match on other resumes.
# ---------------------------------------------------------------------------
MARKETING_SALES_SKILLS = {
    "digital marketing": [
        "online marketing",
        "internet marketing",
    ],
    "seo": [
        "search engine optimization",
        "search engine optimisation",
    ],
    "on page seo": [
        "on-page seo",
        "onpage seo",
    ],
    "off page seo": [
        "off-page seo",
        "offpage seo",
    ],
    "technical seo": [
    ],
    "keyword research": [
        "keyword analysis",
    ],
    "local seo": [
        "local search optimization",
    ],
    "sem": [
        "search engine marketing",
        "ppc",  # review: short acronym
        "pay per click",
    ],
    "google ads": [
        "google adwords",
        "adwords",
    ],
    "youtube ads": [
        "youtube advertising",
    ],
    "facebook ads": [
        "facebook advertising",
    ],
    "instagram ads": [
        "instagram advertising",
    ],
    "meta ads": [
        "meta advertising",
    ],
    "linkedin ads": [
        "linkedin advertising",
    ],
    "social media marketing": [
        "smm",  # review: short acronym
        "social media management",
    ],
    "digital marketing campaigns": [
        "digital campaigns",
        "marketing campaigns",
    ],
    "content marketing": [
        "content strategy",
    ],
    "content writing": [
        "web content writing",
    ],
    "blog writing": [
        "blogs",  # review: very generic word
        "blog creation",
    ],
    "article writing": [
        "articles",  # review: very generic word
    ],
    "copywriting": [
        "ad copy",
        "advertising copy",
    ],
    "whitepaper": [
        "white papers",
    ],
    "ebook": [
        "ebooks",
        "e-book",
        "e-books",
    ],
    "case studies": [
        "case study",
    ],
    "newsletter": [
        "email newsletter",
    ],
    "webinars": [
        "webinar",
        "online seminars",
    ],
    "email marketing": [
    ],
    "email automation": [
        "drip campaigns",
    ],
    "google analytics": [
        "ga4",
        "google analytics 4",
    ],
    "google search console": [
        "gsc",  # review: short acronym
        "search console",
    ],
    "conversion rate optimization": [
        "cro",  # review: short acronym
        "conversion rate optimisation",
    ],
    "a/b testing": [
        "ab testing",
        "split testing",
    ],
    "lead generation": [
        "lead gen",
        "demand generation",
        "lead sourcing",
        "lead acquisition",
        "lead mining",
    ],
    "performance marketing": [
        "paid media",
    ],
    "affiliate marketing": [
        "partner marketing",
    ],
    "influencer marketing": [
        "creator marketing",
    ],
    "marketing analytics": [
        "campaign analytics",
    ],
    "brand management": [
        "brand awareness",
        "brand positioning",
    ],
    "market research": [
        "industry research",
        "market analysis",
        "market intelligence",
    ],
    "ecommerce marketing": [
        "e-commerce marketing",
    ],
    "marketing reporting": [
        "campaign reporting",
        "roi analysis",
        "roas",
        "return on ad spend",
    ],
    "inside sales": [
        "inbound sales",
        "telephone sales",
    ],
    "sales prospecting": [
        "prospecting",
        "lead prospecting",
        "outbound prospecting",
    ],
    "database building": [
        "lead database",
        "prospect database",
    ],
    "linkedin sourcing": [
        "linkedin prospecting",
        "linkedin lead generation",
    ],
    "communication skills": [
        "communication",  # review: on almost every resume
        "verbal communication",
        "written communication",
        "business communication",
    ],
    "active listening": [
        "listening skills",
    ],
    "email etiquette": [
        "professional email etiquette",
        "business email writing",
    ],
    "presentation skills": [
        "sales presentations",
        "client presentations",
    ],
    "cold calling": [
        "cold calls",
        "outbound calling",
    ],
    "outbound sales": [
        "outbound selling",
    ],
    "email campaigns": [
        "sales email campaigns",
        "outbound email campaigns",
        "email outreach",
    ],
    "linkedin outreach": [
        "linkedin messaging",
        "sales outreach on linkedin",
    ],
    "appointment setting": [
        "meeting scheduling",
        "meeting booking",
    ],
    "lead qualification": [
        "prospect qualification",
        "sales qualification",
    ],
    "bant qualification": [
        "bant",
        "budget authority need timeline",
    ],
    "need analysis": [
        "needs analysis",
        "customer needs assessment",
        "requirement analysis",
    ],
    "opportunity identification": [
        "sales opportunity identification",
    ],
    "relationship management": [
        "customer relationship management",
        "client relationship management",
    ],
    "customer engagement": [
        "client engagement",
    ],
    "rapport building": [
        "building rapport",
    ],
    "stakeholder management": [
        "stakeholder engagement",
    ],
    "follow up management": [
        "follow-up management",
        "sales follow ups",
    ],
    "sales negotiation": [
        "negotiation",
        "price negotiation",
    ],
    "objection handling": [
        "handling objections",
    ],
    "value-based selling": [
        "value selling",
        "value based selling",
    ],
    "persuasion skills": [
        "persuasion",
        "persuasive selling",
    ],
    "sales closing": [
        "closing techniques",
        "deal closing",
        "closing deals",
    ],
    "crm": [
        "crm management",
        "customer relationship management software",
    ],
    "salesforce": [
        "salesforce crm",
    ],
    "zoho crm": [
        "zoho",  # review: also an employer name on many resumes
    ],
    "hubspot": [
        "hubspot crm",
    ],
    "pipeline management": [
        "sales pipeline",
        "pipeline tracking",
    ],
    "sales reporting": [
        "sales reports",
        "sales performance reporting",
    ],
    "data management": [
        "sales data management",
        "customer data management",
    ],
    "sales forecasting": [
        "revenue forecasting",
        "sales projections",
    ],
    "pipeline analysis": [
        "sales funnel analysis",
    ],
    "data interpretation": [
        "sales data interpretation",
    ],
    "performance tracking": [
        "sales performance tracking",
        "target tracking",
    ],
    "business development": [
        "business growth",
        "new business development",
    ],
    "client acquisition": [
        "customer acquisition",
        "new client acquisition",
    ],
    "client pitching": [
        "business pitching",
    ],
    "networking": [
        "business networking",
        "professional networking",
    ],
    "sales pitching": [
        "sales pitch",
        "product pitching",
    ],
    "product demonstration": [
        "product demo",
        "product presentation",
    ],
    "solution selling": [
        "solution based selling",
    ],
    "value proposition": [
        "value proposition articulation",
    ],
    "consultative selling": [
        "consultative sales",
        "needs based selling",
    ],
    "deal closure": [
        "sales closure",
    ],
    "contract negotiation": [
        "contract discussions",
    ],
    "account management": [
        "client account management",
    ],
    "customer retention": [
        "client retention",
        "customer loyalty",
    ],
    "trust building": [
        "building customer trust",
    ],
    "revenue generation": [
        "revenue growth",
    ],
    "target achievement": [
        "sales target achievement",
        "quota attainment",
    ],
    "sales planning": [
        "sales plan development",
    ],
    "conversion optimization": [
        "lead conversion",
        "sales conversion optimization",
    ],
    "upselling": [
        "up selling",
        "upsell",
    ],
    "cross-selling": [
        "cross selling",
        "cross sell",
    ],
    "competitor analysis": [
        "competitive analysis",
        "competitor tracking",
    ],
    "industry awareness": [
        "industry knowledge",
        "industry trends",
    ],
    "customer insights": [
        "customer behavior analysis",
    ],
    "b2b sales": [
        "b2b",
        "business to business",
        "business to business sales",
    ],
    "saas sales": [
        "software sales",
        "it sales",
        "technology sales",
    ],
    "key account management": [
        "key accounts",
        "strategic account management",
    ],
    "territory management": [
        "sales territory management",
        "territory planning",
    ],
    "strategic partnerships": [
        "partnership development",
        "business partnerships",
    ],
    "sales strategy": [
        "sales strategy development",
    ],
    "fintech sales": [
        "financial technology sales",
        "financial products sales",
        "financial solutions sales",
    ],
    "financial products": [
        "financial product sales",
        "banking products",
        "investment products",
        "insurance products",
        "loan products",
    ],
    "financial solutions": [
        "fintech solutions",
        "financial technology solutions",
        "digital financial solutions",
    ],
    "fintech": [
        "financial technology",
    ],
}

# Category for each skill added above (used only if the skill had no category already).
MARKETING_SALES_CATEGORIES = {
    "digital marketing": "Marketing & Communications",
    "seo": "Marketing & Communications",
    "on page seo": "Marketing & Communications",
    "off page seo": "Marketing & Communications",
    "technical seo": "Marketing & Communications",
    "keyword research": "Marketing & Communications",
    "local seo": "Marketing & Communications",
    "sem": "Marketing & Communications",
    "google ads": "Marketing & Communications",
    "youtube ads": "Marketing & Communications",
    "facebook ads": "Marketing & Communications",
    "instagram ads": "Marketing & Communications",
    "meta ads": "Marketing & Communications",
    "linkedin ads": "Marketing & Communications",
    "social media marketing": "Marketing & Communications",
    "digital marketing campaigns": "Marketing & Communications",
    "content marketing": "Marketing & Communications",
    "content writing": "Marketing & Communications",
    "blog writing": "Marketing & Communications",
    "article writing": "Marketing & Communications",
    "copywriting": "Marketing & Communications",
    "whitepaper": "Marketing & Communications",
    "ebook": "Marketing & Communications",
    "case studies": "Marketing & Communications",
    "newsletter": "Marketing & Communications",
    "webinars": "Marketing & Communications",
    "email marketing": "Marketing & Communications",
    "email automation": "Marketing & Communications",
    "google analytics": "Marketing & Communications",
    "google search console": "Marketing & Communications",
    "conversion rate optimization": "Marketing & Communications",
    "a/b testing": "Marketing & Communications",
    "lead generation": "Marketing & Communications",
    "performance marketing": "Marketing & Communications",
    "affiliate marketing": "Marketing & Communications",
    "influencer marketing": "Marketing & Communications",
    "marketing analytics": "Marketing & Communications",
    "brand management": "Marketing & Communications",
    "market research": "Marketing & Communications",
    "ecommerce marketing": "Marketing & Communications",
    "marketing reporting": "Marketing & Communications",
    "inside sales": "Sales, Pre-Sales & Customer Success",
    "sales prospecting": "Sales, Pre-Sales & Customer Success",
    "database building": "Sales, Pre-Sales & Customer Success",
    "linkedin sourcing": "Sales, Pre-Sales & Customer Success",
    "communication skills": "Transferable, Soft Skills & Consulting",
    "active listening": "Transferable, Soft Skills & Consulting",
    "email etiquette": "Transferable, Soft Skills & Consulting",
    "presentation skills": "Transferable, Soft Skills & Consulting",
    "cold calling": "Sales, Pre-Sales & Customer Success",
    "outbound sales": "Sales, Pre-Sales & Customer Success",
    "email campaigns": "Sales, Pre-Sales & Customer Success",
    "linkedin outreach": "Sales, Pre-Sales & Customer Success",
    "appointment setting": "Sales, Pre-Sales & Customer Success",
    "lead qualification": "Sales, Pre-Sales & Customer Success",
    "bant qualification": "Sales, Pre-Sales & Customer Success",
    "need analysis": "Sales, Pre-Sales & Customer Success",
    "opportunity identification": "Sales, Pre-Sales & Customer Success",
    "relationship management": "Sales, Pre-Sales & Customer Success",
    "customer engagement": "Sales, Pre-Sales & Customer Success",
    "rapport building": "Transferable, Soft Skills & Consulting",
    "stakeholder management": "Transferable, Soft Skills & Consulting",
    "follow up management": "Sales, Pre-Sales & Customer Success",
    "sales negotiation": "Sales, Pre-Sales & Customer Success",
    "objection handling": "Sales, Pre-Sales & Customer Success",
    "value-based selling": "Sales, Pre-Sales & Customer Success",
    "persuasion skills": "Transferable, Soft Skills & Consulting",
    "sales closing": "Sales, Pre-Sales & Customer Success",
    "crm": "Sales, Pre-Sales & Customer Success",
    "salesforce": "Sales, Pre-Sales & Customer Success",
    "zoho crm": "Sales, Pre-Sales & Customer Success",
    "hubspot": "Sales, Pre-Sales & Customer Success",
    "pipeline management": "Sales, Pre-Sales & Customer Success",
    "sales reporting": "Sales, Pre-Sales & Customer Success",
    "data management": "Sales, Pre-Sales & Customer Success",
    "sales forecasting": "Sales, Pre-Sales & Customer Success",
    "pipeline analysis": "Sales, Pre-Sales & Customer Success",
    "data interpretation": "Sales, Pre-Sales & Customer Success",
    "performance tracking": "Sales, Pre-Sales & Customer Success",
    "business development": "Sales, Pre-Sales & Customer Success",
    "client acquisition": "Sales, Pre-Sales & Customer Success",
    "client pitching": "Sales, Pre-Sales & Customer Success",
    "networking": "Transferable, Soft Skills & Consulting",
    "sales pitching": "Sales, Pre-Sales & Customer Success",
    "product demonstration": "Sales, Pre-Sales & Customer Success",
    "solution selling": "Sales, Pre-Sales & Customer Success",
    "value proposition": "Sales, Pre-Sales & Customer Success",
    "consultative selling": "Sales, Pre-Sales & Customer Success",
    "deal closure": "Sales, Pre-Sales & Customer Success",
    "contract negotiation": "Sales, Pre-Sales & Customer Success",
    "account management": "Sales, Pre-Sales & Customer Success",
    "customer retention": "Sales, Pre-Sales & Customer Success",
    "trust building": "Transferable, Soft Skills & Consulting",
    "revenue generation": "Sales, Pre-Sales & Customer Success",
    "target achievement": "Sales, Pre-Sales & Customer Success",
    "sales planning": "Sales, Pre-Sales & Customer Success",
    "conversion optimization": "Sales, Pre-Sales & Customer Success",
    "upselling": "Sales, Pre-Sales & Customer Success",
    "cross-selling": "Sales, Pre-Sales & Customer Success",
    "competitor analysis": "Sales, Pre-Sales & Customer Success",
    "industry awareness": "Sales, Pre-Sales & Customer Success",
    "customer insights": "Sales, Pre-Sales & Customer Success",
    "b2b sales": "Sales, Pre-Sales & Customer Success",
    "saas sales": "Sales, Pre-Sales & Customer Success",
    "key account management": "Sales, Pre-Sales & Customer Success",
    "territory management": "Sales, Pre-Sales & Customer Success",
    "strategic partnerships": "Sales, Pre-Sales & Customer Success",
    "sales strategy": "Sales, Pre-Sales & Customer Success",
    "fintech sales": "Domain — BFSI",
    "financial products": "Domain — BFSI",
    "financial solutions": "Domain — BFSI",
    "fintech": "Domain — BFSI",
}

# Merge into SKILL_ALIASES. Inspect what was added/skipped with MARKETING_SALES_MERGE_REPORT.
MARKETING_SALES_MERGE_REPORT = _merge_additive(SKILL_ALIASES, MARKETING_SALES_SKILLS)


SKILL_CATEGORIES = {
    # ------------------------- IT / Engineering -------------------------
    **{k: "Programming & Software Development" for k in [
        "python", "javascript", "typescript", "java", "c", "c++", "c#", "visual basic",
        "go", "rust", "ruby", "php", "swift", "kotlin", "objective-c", "r", "matlab",
        "scala", "perl", "bash", "powershell", "shell scripting", "html", "css", "sass",
        "web accessibility", "web performance",
        "cobol", "jcl", "cics", "ims", "vsam", "rpg", "pl/i", "rexx", "natural",
        "mainframe", "micro focus", "as/400",
        "react", "angular", "vue.js", "next.js", "nuxt.js", "node.js", "express.js",
        "django", "flask", "fastapi", "spring framework", "spring boot", "spring cloud",
        "asp.net", ".net", ".net core", "ruby on rails", "laravel", "symfony", "jquery",
        "redux", "graphql", "rest api", "soap api", "microservices", "webhooks", "grpc",
        "websocket", "oauth", "saml", "openid connect",
        "android development", "ios development", "react native", "flutter", "xamarin",
        "maui", "kotlin multiplatform", "electron", "wpf",
        "embedded systems", "firmware development", "pcb design", "vlsi", "verilog",
        "rtos", "iot",
    ]},
    **{k: "Data & Analytics" for k in [
        "sql", "sql server", "t-sql", "postgresql", "mysql", "oracle database", "sqlite",
        "mariadb", "mongodb", "redis", "elasticsearch", "cassandra", "dynamodb", "firebase",
        "neo4j", "snowflake", "databricks", "delta lake", "bigquery", "redshift",
        "synapse analytics", "teradata", "db2", "database design", "database administration",
        "query optimization", "data warehousing", "data governance", "master data management",
        "data vault", "lakehouse", "apache iceberg", "apache hudi", "clickhouse",
        "etl", "elt", "data pipelines", "apache airflow", "cloud composer", "dbt",
        "apache spark", "pyspark", "hadoop", "hive", "kafka", "confluent kafka", "flink",
        "beam", "dataflow", "informatica", "talend", "ssis", "ssas", "ssrs",
        "power bi", "dax", "power query", "tableau", "qlik", "looker", "excel",
        "advanced excel", "vba", "google sheets", "business intelligence",
        "data visualization", "statistical analysis", "data analysis", "data storytelling",
        "data quality", "data cataloging", "data lineage", "data migration",
        "real-time analytics", "alteryx", "knime", "matillion", "fivetran", "airbyte",
        "dbt cloud", "superset", "metabase", "dataops", "data mesh", "data fabric",
    ]},
    **{k: "AI & Machine Learning" for k in [
        "machine learning", "deep learning", "natural language processing", "computer vision",
        "generative ai", "large language models", "prompt engineering",
        "retrieval augmented generation", "vector databases",
        "pinecone", "weaviate", "chroma", "milvus", "faiss",
        "langchain", "llamaindex", "openai api", "hugging face",
        "tensorflow", "pytorch", "scikit-learn", "xgboost", "lightgbm", "catboost",
        "opencv", "mlflow", "kubeflow", "mlops", "model deployment", "feature engineering",
        "recommendation systems", "time series forecasting", "reinforcement learning",
        "speech recognition", "ocr", "responsible ai", "ai evaluation",
        "fine tuning", "rlhf", "sagemaker", "azure ml", "vertex ai", "watson",
        "github copilot", "ai governance", "aiops",
    ]},
    **{k: "Cloud, DevOps & Infrastructure" for k in [
        "aws", "azure", "gcp", "ec2", "s3", "lambda", "cloudformation",
        "eks", "ecs", "fargate", "rds", "aurora", "sqs", "sns", "kinesis",
        "glue", "athena", "emr", "cloudfront", "route 53", "vpc", "aws iam",
        "azure data factory", "azure functions", "azure devops",
        "azure kubernetes service", "azure app service", "azure sql", "cosmos db",
        "blob storage", "event hub", "service bus", "logic apps",
        "azure api management", "entra id",
        "google cloud storage", "cloud run", "cloud functions", "gke", "pub/sub",
        "cloud sql", "spanner",
        "cloud networking", "cloud security", "cloud architecture",
        "multi-cloud", "hybrid cloud", "cloud migration", "cloud-native", "serverless",
        "finops", "docker", "kubernetes", "openshift", "rancher",
        "terraform", "ansible", "pulumi", "chef", "puppet", "saltstack", "packer", "vagrant",
        "jenkins", "github actions", "gitlab ci/cd", "circleci", "travis ci",
        "bamboo", "teamcity", "octopus deploy", "harness", "spinnaker",
        "argocd", "flux", "helm", "kustomize", "istio", "linkerd", "consul", "vault",
        "ci/cd", "devops", "devsecops", "gitops", "platform engineering",
        "linux", "unix", "windows server", "networking", "dns", "tcp/ip",
        "load balancing", "nginx", "apache http server", "virtualization",
        "infrastructure as code", "site reliability engineering", "observability",
        "prometheus", "grafana", "datadog", "splunk", "new relic", "dynatrace",
        "elk stack", "fluentd", "jaeger", "opentelemetry",
        "cisco", "juniper", "palo alto", "fortinet", "f5", "citrix",
        "sd-wan", "mpls", "bgp", "ospf", "vpn", "firewalls", "ids/ips",
    ]},
    **{k: "Enterprise Apps (SAP/Oracle/Salesforce/ServiceNow)" for k in [
        "sap", "sap abap", "sap hana", "sap s/4hana", "sap basis",
        "sap mm", "sap sd", "sap fi", "sap co", "sap fico",
        "sap pp", "sap qm", "sap pm", "sap wm", "sap hcm",
        "sap successfactors", "sap ariba", "sap concur", "sap btp",
        "sap is-u", "sap crm", "sap bw", "sap bo",
        "oracle erp", "oracle ebs", "oracle fusion cloud", "oracle hcm", "oracle scm",
        "peoplesoft", "jd edwards",
        "microsoft dynamics", "dynamics 365 finance", "dynamics 365 supply chain",
        "dynamics 365 customer engagement",
        "salesforce", "salesforce admin", "salesforce developer", "salesforce cpq",
        "salesforce marketing cloud", "salesforce service cloud", "salesforce sales cloud",
        "salesforce lightning", "apex",
        "servicenow", "servicenow itsm", "servicenow itom", "servicenow hrsd", "servicenow csm",
        "workday", "workday hcm", "pega", "appian", "netsuite", "infor", "epicor",
        "guidewire", "duck creek", "temenos", "finacle", "flexcube", "murex", "calypso",
        "bloomberg", "refinitiv", "aladdin", "charles river", "simcorp",
        "amdocs", "netcracker", "blue yonder", "manhattan associates",
        "epic", "cerner", "allscripts", "meditech", "athenahealth", "eclinicalworks",
    ]},
    **{k: "RPA, Low-Code & Automation" for k in [
        "rpa", "uipath", "blue prism", "automation anywhere", "power automate",
        "workfusion", "intelligent automation", "hyperautomation",
        "process mining", "celonis", "signavio",
        "power apps", "power platform", "mendix", "outsystems",
        "low-code", "no-code",
    ]},
    **{k: "Integration & API Management" for k in [
        "mulesoft", "dell boomi", "tibco", "snapLogic", "apigee", "kong",
        "api gateway", "ibm integration bus", "webmethods",
    ]},
    **{k: "IT Service Management (ITSM/ITIL)" for k in [
        "itil", "itsm", "service desk", "incident management", "problem management",
        "change management (itil)", "release management", "configuration management",
        "asset management", "software asset management", "hardware asset management",
        "knowledge management", "service catalog", "sla management", "ola management",
        "it governance", "cobit", "iso 20000", "iso 27001", "iso 22301",
    ]},
    **{k: "Security & Privacy" for k in [
        "cybersecurity", "penetration testing", "vulnerability management", "incident response",
        "siem", "soar", "iam", "pam", "active directory", "zero trust", "encryption",
        "risk assessment", "soc 2", "gdpr", "ccpa", "dpdp", "privacy compliance",
        "endpoint security", "xdr", "mdr", "dlp", "casb", "waf",
        "penetration testing tools", "secure coding", "sast", "dast", "sca",
        "threat modeling", "threat hunting", "red team", "blue team", "purple team",
        "bug bounty", "soc", "sase", "ztna", "container security",
        "cloud security posture", "devsecops",
        "cissp", "cism", "cisa", "ceh", "oscp",
    ]},
    **{k: "QA, Testing & Product Delivery" for k in [
        "software testing", "manual testing", "test automation", "selenium", "playwright",
        "cypress", "pytest", "junit", "testng", "postman", "api testing",
        "performance testing", "accessibility testing", "regression testing",
        "test planning", "jira", "confluence", "agile", "scrum", "kanban",
        "safe", "less", "scrum master", "product owner", "release train engineer",
        "agile coaching", "agile transformation", "waterfall", "hybrid methodology",
        "pmp", "prince2", "pmi-acp",
        "product management", "product discovery", "product strategy", "product roadmap",
        "product lifecycle management", "user stories", "backlog management",
        "requirements gathering", "business analysis", "process mapping",
        "process improvement", "change management", "technical documentation",
        "test management", "sdet", "bdd", "tdd", "mobile testing", "security testing",
        "chaos engineering", "contract testing",
        "tosca", "uft", "katalon", "jmeter", "loadrunner", "gatling", "neoload",
        "browserstack", "sauce labs",
    ]},

    # ------------------------- Non-IT / Functional -----------------------
    **{k: "Human Resources & Talent" for k in [
        "talent acquisition", "recruitment", "campus recruitment", "lateral hiring",
        "leadership hiring", "candidate sourcing", "interview coordination",
        "applicant tracking systems", "recruitment marketing", "employer branding",
        "workforce planning", "human resources", "hr business partnering",
        "hr shared services", "employee relations", "employee engagement",
        "employee experience", "engagement survey", "performance management",
        "performance calibration", "goal setting", "learning and development",
        "learning management system", "instructional design", "training needs analysis",
        "certification tracking", "compensation and benefits", "compensation benchmarking",
        "benefits administration", "payroll", "multi-country payroll",
        "statutory compliance", "labor law compliance", "posh", "grievance handling",
        "hr information systems", "hr analytics", "attrition analysis",
        "retention strategy", "talent management", "succession planning",
        "career development", "individual development plan", "mentoring",
        "onboarding", "offboarding", "exit interviews", "organizational development",
        "organization design", "job evaluation", "diversity and inclusion",
        "employee resource groups", "global mobility", "relocation management",
        "background verification", "assessment centers", "psychometric testing",
        "candidate experience", "offer management", "workday hcm", "successfactors",
        "darwinbox", "zoho people", "bamboohr", "adp", "deel", "rippling",
    ]},
    **{k: "Marketing & Communications" for k in [
        "b2b marketing", "demand generation", "account-based marketing",
        "content marketing", "content strategy", "thought leadership",
        "product marketing", "product positioning", "go-to-market strategy",
        "market segmentation", "buyer personas", "customer journey",
        "marketing analytics", "marketing operations", "marketing technology",
        "marketing automation", "marketo", "pardot", "eloqua", "mailchimp",
        "braze", "iterable", "klaviyo", "campaign management",
        "multi-channel marketing", "email marketing", "social media marketing",
        "linkedin marketing", "influencer marketing", "community management",
        "event marketing", "webinar marketing", "trade shows",
        "seo", "sem", "ppc", "google ads", "programmatic advertising",
        "display advertising", "retargeting", "landing pages", "a/b testing",
        "conversion rate optimization", "marketing qualified lead",
        "sales qualified lead", "lead scoring", "lead nurturing",
        "funnel optimization", "attribution modeling", "marketing roi",
        "customer acquisition cost", "brand management", "brand strategy",
        "brand awareness", "public relations", "media relations",
        "analyst relations", "investor relations", "crisis communications",
        "internal communications", "customer advocacy", "customer marketing",
        "partner marketing", "product launch", "market research",
        "competitive intelligence", "win/loss analysis", "voice of customer",
        "net promoter score", "csat", "content writing", "technical writing",
        "video production", "podcast production", "web design",
        "localization", "google analytics", "adobe experience manager", "hubspot",
        "communications",
    ]},
    **{k: "Sales, Pre-Sales & Customer Success" for k in [
        "sales", "enterprise sales", "solution selling", "consultative selling",
        "value-based selling", "challenger sale", "spin selling", "meddic", "meddpicc",
        "sales methodology", "sales process", "pipeline management",
        "opportunity management", "deal management", "territory management",
        "account planning", "named accounts", "quota management", "sales forecasting",
        "sales operations", "sales enablement", "sales training", "sales coaching",
        "sales playbooks", "battle cards", "pricing strategy", "deal desk",
        "cpq", "salesforce cpq", "oracle cpq", "pros", "conga",
        "contract management", "order management", "crm",
        "zoho crm", "freshsales", "pipedrive", "outreach", "salesloft",
        "gong", "clari", "inside sales", "field sales", "channel sales",
        "partner sales", "alliance management", "reseller management",
        "system integrator partnerships", "isv partnerships", "oem partnerships",
        "technology partnerships", "strategic partnerships",
        "pre-sales", "solutions consulting", "technical pre-sales",
        "demo engineering", "proof of concept", "proof of value",
        "rfp response", "rfi response", "bid management", "proposal management",
        "proposal writing", "statement of work", "master service agreement",
        "commercial negotiation", "licensing", "subscription management",
        "renewals", "upselling", "cross-selling", "expansion revenue",
        "net revenue retention", "gross revenue retention", "customer lifetime value",
        "customer health score", "customer effort score", "customer advisory board",
        "executive sponsor program", "customer success", "customer onboarding",
        "customer adoption", "customer support", "technical support",
        "call center operations", "customer experience", "customer retention",
        "service level management", "key account management", "account management",
        "managed services", "professional services", "implementation services",
        "consulting services", "advisory services", "systems integration",
        "application development and maintenance", "application management services",
        "infrastructure management services", "business process outsourcing",
        "knowledge process outsourcing", "it outsourcing", "business process services",
        "global capability center", "shared services center", "center of excellence",
        "global delivery model", "offshore delivery", "nearshore delivery",
        "onshore delivery",
    ]},
    **{k: "Finance, Accounting & Procurement" for k in [
        "accounting", "bookkeeping", "accounts payable", "accounts receivable",
        "general ledger", "financial reporting", "financial analysis",
        "financial modeling", "budgeting", "forecasting", "fp&a",
        "management reporting", "board reporting", "variance analysis",
        "cost accounting", "taxation", "gst", "vat", "corporate tax",
        "transfer pricing", "ifrs", "gaap", "us gaap", "ind as",
        "asc 606", "ifrs 15", "asc 842", "ifrs 16", "revenue recognition",
        "percentage of completion", "subscription revenue", "saas metrics",
        "arr", "mrr", "acv", "tcv", "bookings", "billings", "backlog",
        "deferred revenue", "unbilled revenue", "order to cash", "procure to pay",
        "record to report", "hire to retire", "fixed assets", "project accounting",
        "cost center accounting", "profit center accounting",
        "working capital management", "cash flow management", "treasury",
        "foreign exchange", "hedging", "investment analysis", "valuation",
        "m&a", "due diligence", "post-merger integration", "carve-out",
        "ipo readiness", "fundraising", "internal audit", "external audit",
        "sox compliance", "icfr", "risk management", "enterprise risk management",
        "coso", "forensic audit", "fraud investigation", "audit analytics",
        "sap fico", "sap co", "oracle financials", "netsuite", "quickbooks",
        "tally", "xero", "hyperion", "anaplan", "blackline", "concur", "coupa",
        "ariba", "accounts reconciliation", "procurement", "strategic sourcing",
        "vendor management", "supplier relationship management",
        "contract management", "purchase order management", "invoice processing",
        "expense management", "gst audit", "tax audit", "information systems audit",
        "process audit", "operational audit", "compliance audit",
        "sap grc", "oracle grc", "metricstream", "archer", "servicenow grc",
    ]},
    **{k: "Legal, Compliance & Governance" for k in [
        "legal research", "contract drafting", "contract review", "contract negotiation",
        "commercial law", "corporate law", "employment law", "intellectual property",
        "patent", "trademark", "copyright", "trade secret", "open source compliance",
        "data privacy law", "anti-trust", "export control", "sanctions",
        "anti-bribery", "corporate governance", "company secretarial", "litigation",
        "dispute resolution", "arbitration", "mediation", "legal operations",
        "contract lifecycle management", "ironclad", "docusign", "adobe sign",
        "icertis", "sirionlabs", "legal entity management", "corporate restructuring",
        "kyc", "aml", "fraud detection", "policy development",
        "esg", "sustainability reporting", "carbon accounting", "net zero",
        "compliance", "regulatory affairs", "risk assessment",
        "third-party risk management", "vendor risk management",
    ]},
    **{k: "Design, UX & Content" for k in [
        "ui design", "ux design", "user research", "usability testing",
        "wireframing", "prototyping", "figma", "adobe xd", "adobe photoshop",
        "adobe illustrator", "sketch", "invision", "framer", "miro", "mural",
        "figjam", "design thinking", "service design", "information architecture",
        "interaction design", "motion design", "inclusive design", "design systems",
        "component library", "style guide", "graphic design", "visual design",
        "usertesting", "hotjar", "optimizely", "vwo", "google optimize",
    ]},
    **{k: "Operations, Admin & Facilities" for k in [
        "operations management", "project management", "program management",
        "portfolio management", "pmo", "project governance", "project controls",
        "project scheduling", "resource management", "utilization management",
        "bench management", "demand management", "capacity planning",
        "workforce management", "shift management", "roster management",
        "time and attendance", "timesheet management", "leave management",
        "facilities management", "office administration", "workplace management",
        "space planning", "move management", "transport management", "fleet management",
        "travel management", "visa and immigration", "physical security",
        "access control", "cctv", "fire safety", "emergency response",
        "business continuity planning", "disaster recovery", "health and safety",
        "ergonomics", "wellness programs", "environmental compliance",
        "e-waste management", "supply chain management", "logistics",
        "inventory management", "warehouse management", "demand planning",
        "supply planning", "production planning", "production scheduling",
        "quality management", "iso 9001", "lean", "six sigma", "kaizen",
        "dmaic", "dmadv", "5s", "fmea", "root cause analysis", "5 whys",
        "fishbone", "pareto", "value stream mapping", "bpmn", "erp",
        "microsoft dynamics", "servicenow",
    ]},
    **{k: "Engineering, Manufacturing & Construction" for k in [
        "autocad", "revit", "bim", "solidworks", "catia", "ansys", "creo",
        "plc programming", "scada", "hmi", "mes", "robotics",
        "mechanical design", "electrical design", "civil engineering",
        "structural engineering", "quantity surveying", "estimation",
        "construction management", "gis", "arcgis", "qgis", "fme",
        "industry 4.0", "iiot", "digital twin", "predictive maintenance",
        "condition monitoring", "asset performance management", "reliability engineering",
        "maintenance management", "cmms", "eam", "maximo",
    ]},
    **{k: "Domain — BFSI" for k in [
        "banking", "investment banking", "capital markets", "wealth management",
        "asset management", "trading", "equities", "fixed income", "derivatives",
        "forex", "commodities", "risk management bfsi", "basel iii", "ifrs 9",
        "cecl", "stress testing", "var", "credit scoring", "underwriting",
        "loan origination", "loan servicing", "collections", "mortgages", "cards",
        "payments", "swift", "sepa", "ach", "rtgs", "neft", "upi", "imps",
        "trade finance", "letters of credit", "supply chain finance",
        "insurance", "life insurance", "general insurance", "health insurance",
        "reinsurance", "claims management", "policy administration",
        "agency management", "bancassurance", "actuarial",
    ]},
    **{k: "Domain — Healthcare & Life Sciences" for k in [
        "clinical research", "clinical data management", "good clinical practice",
        "pharmacovigilance", "regulatory affairs", "medical coding", "medical billing",
        "revenue cycle management", "hipaa", "hl7", "fhir", "electronic health records",
        "laboratory operations", "quality assurance pharma", "biostatistics",
        "bioinformatics", "medical writing", "patient care", "health information management",
        "clinical trials", "medical affairs", "drug safety", "ich-gcp", "glp", "gvp",
        "iso 13485", "21 cfr part 11", "cdisc", "meddra", "snomed", "loinc",
        "icd-10", "icd-11", "cpt", "telehealth", "digital health",
        "population health", "value-based care", "interoperability",
    ]},
    **{k: "Domain — Retail, Telecom, Energy & Manufacturing" for k in [
        "retail", "e-commerce", "omnichannel", "pos", "merchandising",
        "assortment planning", "pricing", "promotion", "markdown", "loyalty programs",
        "personalization", "recommendation engine", "digital commerce", "marketplace",
        "dropship", "bopis", "click and collect", "last mile delivery",
        "demand forecasting", "replenishment", "vendor managed inventory",
        "category management", "space planning", "planogram", "retail analytics",
        "basket analysis", "shopper marketing", "trade marketing", "channel management",
        "distributor management", "retail execution", "field force automation",
        "salesforce automation",
        "manufacturing", "production", "shop floor", "mrp", "mrp ii",
        "lean manufacturing", "tpm", "oee", "smed",
        "telecom", "oss", "bss", "network management", "service assurance",
        "service fulfillment", "billing", "charging", "revenue assurance",
        "fraud management", "5g", "4g", "volte", "ims", "ran", "core network",
        "sdn", "nfv", "network slicing", "mec", "o-ran", "vran", "cran",
        "small cells", "das", "fiber", "ftth", "gpon", "xgspon", "dwdm", "otn",
        "segment routing", "evpn", "vxlan",
        "energy", "oil and gas", "utilities", "power", "electricity", "gas",
        "water", "renewables", "solar", "wind", "smart grid", "ami",
        "meter data management", "ems", "dms", "oms",
    ]},
    **{k: "Domain — Education & Public Sector" for k in [
        "teaching", "curriculum development", "e-learning", "student counseling",
        "academic administration", "research", "survey design", "data collection",
        "edtech", "moodle", "canvas lms", "blackboard", "google classroom",
        "coursera", "udemy", "edx", "khan academy", "student information system",
        "powerschool", "ellucian", "learning analytics", "assessment",
        "proctoring", "psychometrics", "adaptive learning", "gamification",
        "blended learning", "flipped classroom", "mooc", "microlearning",
        "mobile learning", "virtual classroom", "articulate", "adobe captivate",
        "lectora", "h5p", "scorm", "xapi",
        "public sector", "e-government", "g2c", "g2b", "g2g", "citizen services",
        "smart cities", "urban planning", "transportation", "public safety",
        "law enforcement", "emergency services", "defense", "homeland security",
        "tax administration", "social services", "welfare", "pension",
        "land records", "municipal services", "case management",
        "permit management", "licensing", "grants management", "public finance",
        "digital india", "aadhaar", "digilocker", "umang", "ekyc", "dbt", "csc",
    ]},
    **{k: "Transferable, Soft Skills & Consulting" for k in [
        "communication", "presentation skills", "stakeholder management",
        "stakeholder analysis", "leadership", "people management", "teamwork",
        "problem solving", "critical thinking", "analytical thinking",
        "time management", "attention to detail", "conflict resolution",
        "decision making", "adaptability", "mentoring", "customer orientation",
        "strategic planning", "facilitation", "training delivery", "documentation",
        "business acumen", "commercial awareness", "global mindset",
        "virtual collaboration", "executive presence", "storytelling",
        "consulting", "business transformation", "digital transformation",
        "organization change management", "prosci", "adkar", "kotter",
        "business case", "roi analysis", "tco analysis", "cost-benefit analysis",
        "feasibility study", "gap analysis", "current state assessment",
        "future state design", "enterprise architecture", "togaf", "zachman",
        "solution architecture", "business architecture", "data architecture",
        "application architecture", "integration architecture", "security architecture",
        "it strategy", "technology roadmap", "it portfolio management",
        "it financial management", "technology business management", "apptio",
        "it budgeting", "it cost optimization", "it vendor management",
        "it sourcing", "it procurement", "it asset management",
        "service catalog", "cmdb", "continuity management", "availability management",
        "capacity management", "deployment management", "environment management",
        "pmo setup", "pmo operations",
        "clarity ppm", "planview", "smartsheet", "monday.com", "asana", "trello",
        "basecamp", "rally", "jira align", "azure boards", "ms project", "primavera",
        "slack", "microsoft teams", "zoom", "webex", "sharepoint", "onedrive",
        "google workspace", "ms office", "powerpoint", "outlook", "visio",
        "lucidchart", "draw.io", "docusign", "adobe sign", "confluence",
        "notion", "coda", "airtable",
    ]},
}


# Categories for the Digital Marketing & Sales skills. setdefault keeps any
# category a skill already had.
for _skill, _category in MARKETING_SALES_CATEGORIES.items():
    SKILL_CATEGORIES.setdefault(_skill, _category)


# ---------------------------------------------------------------------------
# SKILL_MAPPINGS — umbrella groups for UI/reporting only. Never award
# individual skills from an umbrella match.
# ---------------------------------------------------------------------------
SKILL_MAPPINGS = {
    "programming": [
        "python", "javascript", "typescript", "java", "c", "c++", "c#",
        "go", "rust", "ruby", "php", "swift", "kotlin", "r", "scala",
        "cobol", "jcl", "cics", "rpg",
    ],
    "web development": [
        "html", "css", "javascript", "typescript", "react", "angular",
        "vue.js", "node.js", "django", "flask", "fastapi", "rest api", "graphql",
    ],
    "databases": [
        "sql", "sql server", "postgresql", "mysql", "oracle database",
        "mongodb", "redis", "snowflake", "bigquery", "redshift",
    ],
    "data engineering": [
        "etl", "elt", "data pipelines", "apache airflow", "dbt",
        "apache spark", "pyspark", "hadoop", "kafka", "dataflow",
    ],
    "business intelligence": [
        "power bi", "tableau", "qlik", "looker", "excel", "dax",
        "power query", "data visualization",
    ],
    "machine learning": [
        "machine learning", "deep learning", "natural language processing",
        "computer vision", "tensorflow", "pytorch", "scikit-learn", "xgboost", "mlops",
    ],
    "cloud": [
        "aws", "azure", "gcp", "ec2", "s3", "lambda", "bigquery",
        "cloud run", "azure data factory",
    ],
    "devops": [
        "docker", "kubernetes", "terraform", "ansible", "jenkins",
        "github actions", "gitlab ci/cd", "ci/cd", "linux",
    ],
    "cybersecurity": [
        "cybersecurity", "penetration testing", "vulnerability management",
        "incident response", "siem", "iam", "iso 27001",
    ],
    "testing": [
        "software testing", "manual testing", "test automation", "selenium",
        "playwright", "cypress", "pytest", "api testing",
    ],
    "erp": [
        "sap", "oracle erp", "oracle ebs", "oracle fusion cloud",
        "microsoft dynamics", "netsuite", "infor", "epicor",
    ],
    "crm": [
        "salesforce", "microsoft dynamics", "hubspot", "zoho crm", "freshsales",
        "pipedrive", "crm",
    ],
    "itsm": [
        "servicenow", "itil", "itsm", "service desk", "incident management",
        "change management (itil)", "cmdb",
    ],
    "human resources": [
        "talent acquisition", "recruitment", "candidate sourcing",
        "interview coordination", "hris", "payroll", "employee relations",
    ],
    "finance and accounting": [
        "accounting", "bookkeeping", "accounts payable", "accounts receivable",
        "financial reporting", "financial analysis", "budgeting", "taxation",
        "internal audit",
    ],
    "sales and customer success": [
        "sales", "lead generation", "crm", "salesforce", "account management",
        "customer success", "customer support", "negotiation",
    ],
    "operations and supply chain": [
        "operations management", "supply chain management", "logistics",
        "inventory management", "warehouse management", "procurement",
        "vendor management",
    ],
    "design and marketing": [
        "ui design", "ux design", "figma", "graphic design", "seo", "sem",
        "social media marketing", "email marketing", "campaign management",
    ],
    "domain bfsi": [
        "banking", "insurance", "capital markets", "wealth management",
        "payments", "risk management bfsi",
    ],
    "domain healthcare": [
        "clinical research", "pharmacovigilance", "hipaa", "hl7", "fhir",
        "electronic health records",
    ],
    "domain retail": [
        "retail", "e-commerce", "merchandising", "omnichannel",
        "demand forecasting", "loyalty programs",
    ],
}