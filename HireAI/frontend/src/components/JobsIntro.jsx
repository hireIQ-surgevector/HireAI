function JobsIntro({ eyebrow, title, description, icon: Icon, actions }) {
  return (
    <div className="jobs-intro">
      <div>
        {eyebrow && <p className="jobs-eyebrow">{eyebrow}</p>}

        <h2>{title}</h2>

        {description && <p>{description}</p>}
      </div>

      <div className="jobs-intro-side">
        {actions && <div className="app-page-actions">{actions}</div>}

        {Icon && (
          <div className="jobs-intro-mark">
            <Icon size={28} />
          </div>
        )}
      </div>
    </div>
  );
}

export default JobsIntro;