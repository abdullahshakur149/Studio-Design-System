import { Link } from 'react-router-dom';
import { Image as ImageIcon, Video, Library, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Wordmark } from '@/components/ui/Wordmark';

export function LandingPage(): JSX.Element {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Wordmark size={22} />
        </Link>
        <div className="landing-nav-actions">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="primary" size="sm">
              Get started
            </Button>
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-eyebrow">
          <span className="pulse" />
          Now generating photo + video
        </div>
        <h1 className="landing-h1">
          Create AI videos and photos <span className="em">free.</span>
        </h1>
        <p className="landing-sub">
          A focused studio for prompting, generating, and curating your own visual media — designed for creators who
          want speed and clarity.
        </p>
        <div className="landing-cta">
          <Link to="/signup">
            <Button variant="primary" size="lg" rightIcon={<ArrowRight size={16} />}>
              Get started
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost" size="lg">
              Sign in
            </Button>
          </Link>
        </div>
      </section>

      <section className="landing-features">
        <div className="feature-card">
          <div className="feature-ic">
            <ImageIcon size={20} />
          </div>
          <h3 className="feature-h">Photos in seconds</h3>
          <p className="feature-p">Five styles, three aspect ratios. Prompt, click, done.</p>
        </div>
        <div className="feature-card">
          <div className="feature-ic">
            <Video size={20} />
          </div>
          <h3 className="feature-h">Short-form video</h3>
          <p className="feature-p">Short clips from a prompt or a starting image. Pick your mood and motion.</p>
        </div>
        <div className="feature-card">
          <div className="feature-ic">
            <Library size={20} />
          </div>
          <h3 className="feature-h">A library that respects you</h3>
          <p className="feature-p">Everything you make stays organized, downloadable, and yours.</p>
        </div>
      </section>
    </div>
  );
}
