import mock

from django.test import TestCase
from django.utils.safestring import SafeData

from seahub.utils import convert_cmmt_desc_link

class ConvertCmmtDescLinkTest(TestCase):
    desc_list_need_link = [
        'Added "foo.txt".',
        'Modified "foo.txt".',
        'Renamed "foo.txt".',
        'Moved "foo.txt".',
        'Added directory "bar".',
        'Renamed directory "bar".',
        'Moved directory "bar".',
    ]

    desc_list_dont_need_link = [
        'Deleted "foo.txt".',
        'Reverted file "foo.txt" to status at 2015-12-21.',
        'Removed directory "bar".',
    ]

    def test_link_added_to_desc(self):
        for e in self.desc_list_need_link:
            add_file_commit = mock.Mock()
            add_file_commit.repo_id = 'ee6215c9-f0c1-480b-853a-2e37c85e7d26'
            add_file_commit.id = 'fa2c3297cc70afd556f0723af47beeaf76b44af8'
            add_file_commit.desc = e

            ret = convert_cmmt_desc_link(add_file_commit)
            self.assertIn('<a href', ret)
            self.assertIsInstance(ret, SafeData)
            self.assertNotIsInstance(ret, str)

    def test_escape_bad_desc(self):
        commit = mock.Mock()
        commit.repo_id = 'ee6215c9-f0c1-480b-853a-2e37c85e7d26'
        commit.id = 'fa2c3297cc70afd556f0723af47beeaf76b44af8'
        commit.desc = 'Added "<script>"'

        ret = convert_cmmt_desc_link(commit)
        self.assertIn('<a href', ret)
        self.assertNotIn('<script>', ret)
        self.assertIsInstance(ret, SafeData)
        self.assertNotIsInstance(ret, str)

    def test_link_not_added_to_desc(self):
        for e in self.desc_list_dont_need_link:
            add_file_commit = mock.Mock()
            add_file_commit.repo_id = 'ee6215c9-f0c1-480b-853a-2e37c85e7d26'
            add_file_commit.id = 'fa2c3297cc70afd556f0723af47beeaf76b44af8'
            add_file_commit.desc = e

            ret = convert_cmmt_desc_link(add_file_commit)
            self.assertNotIn('<a href', ret)
            self.assertNotIsInstance(ret, SafeData)
            self.assertIsInstance(ret, str)
