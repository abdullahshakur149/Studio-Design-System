import { useSearchParams } from 'react-router-dom';
import { Image as ImageIcon, Video } from 'lucide-react';
import { CreatePhotoForm } from './CreatePhotoForm';
import { CreateVideoForm } from './CreateVideoForm';

type Tab = 'photo' | 'video';

function parseTab(value: string | null): Tab {
  return value === 'video' ? 'video' : 'photo';
}

export function CreatePage(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseTab(searchParams.get('type'));

  function setTab(next: Tab): void {
    setSearchParams({ type: next });
  }

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1 className="page-h">Create</h1>
          <p className="page-sub">
            Prompt, tweak, generate. {tab === 'photo' ? 'Photos' : 'Videos'} take 30–120s.
          </p>
        </div>
      </div>
      <div className="create-tabs">
        <button
          type="button"
          className={`create-tab ${tab === 'photo' ? 'active' : ''}`}
          onClick={() => setTab('photo')}
        >
          <ImageIcon size={16} /> Photo
        </button>
        <button
          type="button"
          className={`create-tab ${tab === 'video' ? 'active' : ''}`}
          onClick={() => setTab('video')}
        >
          <Video size={16} /> Video
        </button>
      </div>
      {tab === 'photo' ? <CreatePhotoForm /> : <CreateVideoForm />}
    </div>
  );
}
