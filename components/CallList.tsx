'use client';
import MeetingCard from './MeetingCard';

const CallList = ({ type }: { type: 'ended' | 'upcoming' | 'recordings' }) => {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <MeetingCard
        icon={
          type === 'ended'
            ? '/icons/previous.svg'
            : type === 'upcoming'
              ? '/icons/upcoming.svg'
              : '/icons/recordings.svg'
        }
        title={'No Description'}
        date={new Date().getDate().toLocaleString()}
        isPreviousMeeting={type === 'ended'}
        link={'some link'}
        buttonIcon1={type === 'recordings' ? '/icons/play.svg' : undefined}
        buttonText={type === 'recordings' ? 'Play' : 'Start'}
        handleClick={() => {}}
      />
    </div>
  );
};

export default CallList;
