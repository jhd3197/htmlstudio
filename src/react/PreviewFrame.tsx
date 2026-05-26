import type { Ref, CSSProperties } from 'react';
import { DeviceFrame, type FrameDef } from './DeviceFrame.js';

export interface PreviewFrameProps {
  src?: string;
  html?: string;
  editSrcDoc?: string | null;
  contentHash?: string;
  width?: string | null;
  frame?: string | null;
  frames?: Record<string, FrameDef>;
  iframeRef?: Ref<HTMLIFrameElement>;
}

export function PreviewFrame({
  src,
  html,
  editSrcDoc,
  contentHash,
  width,
  frame,
  frames,
  iframeRef,
}: PreviewFrameProps) {
  const editing = !!editSrcDoc;
  const hasSrcdoc = editing || !!html;
  const urlLabel = editing
    ? 'edit:live'
    : hasSrcdoc
      ? `srcdoc:live (${contentHash || 'preview'})`
      : src || 'about:blank';

  const renderIframe = () => {
    if (editing) {
      return (
        <iframe
          key="edit"
          ref={iframeRef}
          srcDoc={editSrcDoc ?? undefined}
          className="hs-preview__iframe"
          title="Page Preview (edit)"
          sandbox="allow-scripts"
        />
      );
    }
    if (html) {
      return (
        <iframe
          key={contentHash || 'live'}
          ref={iframeRef}
          srcDoc={html}
          className="hs-preview__iframe"
          title="Page Preview (live)"
          sandbox="allow-scripts"
        />
      );
    }
    if (src) {
      return (
        <iframe
          key={src}
          ref={iframeRef}
          src={src}
          className="hs-preview__iframe"
          title="Page Preview"
          sandbox="allow-scripts"
        />
      );
    }
    return <div className="hs-preview__empty">No preview available yet</div>;
  };

  const wrapStyle: CSSProperties = { width: width || '100%', maxWidth: '1200px' };

  if (frame) {
    return (
      <div className="hs-preview hs-preview--framed" style={wrapStyle}>
        <DeviceFrame frame={frame} frames={frames}>
          {renderIframe()}
        </DeviceFrame>
      </div>
    );
  }

  return (
    <div className="hs-preview" style={wrapStyle}>
      <div className="hs-preview__chrome">
        <div className="hs-preview__dots">
          <span className="hs-preview__dot hs-preview__dot--red" />
          <span className="hs-preview__dot hs-preview__dot--yellow" />
          <span className="hs-preview__dot hs-preview__dot--green" />
        </div>
        <div className="hs-preview__url-wrap">
          <div className="hs-preview__url">{urlLabel}</div>
        </div>
        {editing ? (
          <span className="hs-preview__badge hs-preview__badge--edit">● edit</span>
        ) : hasSrcdoc ? (
          <span className="hs-preview__badge hs-preview__badge--live">● live</span>
        ) : null}
      </div>
      <div className="hs-preview__body">{renderIframe()}</div>
    </div>
  );
}

export default PreviewFrame;
