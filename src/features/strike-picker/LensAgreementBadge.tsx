type Props = {
  agree: boolean;
};

export function LensAgreementBadge({ agree }: Props) {
  if (agree) {
    return (
      <div className="rounded-lg border border-green-800/50 bg-green-900/20 px-4 py-2 text-sm text-green-400">
        All three lenses agree on the top pick
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/30 px-4 py-2 text-sm text-gray-400">
      Lenses disagree — compare trade-offs across columns
    </div>
  );
}
